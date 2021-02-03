//BLE.js

import React, { Component }  from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  TextInput,
  Button,
} from 'react-native';

import { BleManager } from "react-native-ble-plx";
import {decode as atob, encode as btoa} from 'base-64';
import { Buffer } from 'buffer';

Date.prototype.stdTimezoneOffset = function () {
var jan = new Date(this.getFullYear(), 0, 1);
var jul = new Date(this.getFullYear(), 6, 1);
return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

String.prototype.convertToHex = function (delim) {
    return this.split("").map(function(c) {
        return ("0" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(delim || "");
};


var stringPacket = 0;
var stringRx = "";
var stringTerminated = false;

export default class BLE extends Component {

  constructor(props) {
    super(props)
    this.manager = new BleManager({
            restoreStateIdentifier: 'testBleBackgroundMode',
            restoreStateFunction: bleRestoredState => {

            if (bleRestoredState == null){
                console.log('BLE null, not restored.  Starting manager for the first time.')
            } else {

               console.log('BLE should be restored-- this might factor in when backgrounded >15min or autokilled by OS. It is currently untested.')
               /*
               bleRestoredState.connectedPeripherals[0].connect()
                    .then((device) => {
                        this.info("Discovering services and characteristics")
                        let r = device.discoverAllServicesAndCharacteristics()
                        console.log(r)
                        return r
                    }
              */
            }}})
    this.state = {info: "", values: {}, running_vals: [], writeCharacteristic: null, ledState: false, input:'text to send'}
    this.ble_devices = {};

  }

  info(message) {
    this.setState({info: message})
  }

  error(message) {
    this.setState({info: "ERROR: " + message})
  }

  //UI elements for sending data to watch over BLE ===============
  //==============================================================
  UpdateTime(){
    this.sendTimeToWatch();
  }

  LEDPress(){
    this.sendLEDStateToWatch();
  }

  VibrateToggle(){
    this.sendVibrateDurationToWatch();
  }

  onChangeText(e){
      console.log(e);
      console.log(e.target);
      console.log(e.target.value);
    this.setState({ input: e});
      console.log(this.state.input);
  }

  SendText(){
   console.log(this.state.input);
   this.sendTextToWatch(this.state.input);
  }


  //handle BLE Comms =============================================
  //==============================================================
  updateValue(key, value) {

    if (!stringPacket){ // check if rxing continuing packets
        hexval = this.reverseBytes(this.base64ToHex(value));
        console.log('update ' + key + ' : ' + hexval)
        this.setState({values: {...this.state.values, [key]: hexval}, running_vals: [...this.state.running_vals, hexval]})
        console.log(this.state.running_vals);

        timestamp = hexval.slice(0, -5);
        stateupdate = hexval.slice(-4);
        console.log(timestamp);
        console.log(stateupdate);
        console.log(stateupdate.charAt(0));

        switch (stateupdate.charAt(0)){

        case '0': //button 1
            this.props.updateButton(0);
            break;
        case '1': //button 2
            this.props.updateButton(1);
            break;
        case '2': //button 3
            this.props.updateButton(2);
            break;
        case '3': //vibration motor
            this.props.updateVibrate(parseInt(stateupdate.charAt(1)));
            break;
        case '4': //touch event
            this.props.touchEvent(parseInt(stateupdate.slice(-2), 16));
            break;
        case '5': //touch confirm event
            this.props.touchEvent(-1);
            break;
        case '6': //screen update event
            if (stateupdate.charAt(1) == '3') { //sending string
                stringPacket=1;
            } else {
                this.props.updateScreen(stateupdate.charAt(1), '');
            }
            break;

        default:
        }
    } else { //handle string packets
        let toAscii = Buffer.from(this.base64ToHex(value), 'hex');

        if (!stringTerminated){
            if (toAscii.includes(0)){ //reached null character
                toAscii = toAscii.slice(0, toAscii.indexOf(0));
                stringTerminated = true;
            }
            stringRx = stringRx.concat(toAscii.toString());
        }

        if (stringPacket++ == 8) { //got full 8 packets of 16 bytes
            console.log('FINAL STRING:');
            console.log(stringRx);
            this.props.updateScreen('3', stringRx);

            stringPacket = 0;
            stringRx = "";
            stringTerminated = false;
        }
    }
  }

  getDateInBCD(format12 = false){
    //returns DAY (1byte) MONTH (1byte) DATE (1byte) YEAR (1byte) HR (1byte)
    //MIN (1byte) SEC (1byte) 12HRFORMAT (1byte, 0=24HR) AMorPM (1byte, 0=AM) 
    //DAYLIGHTSAVINGS (1byte, 0=None 1=Add1hr) 
    //all as a string

    console.log('Constructing Date...')
    //BCD means we use 0x01-0x12, skipping 0x0A-0x0F (hex *reads* right)
    var day = ("0" + new Date().getDay()).slice(-2);          //uint8_t 0x01-0x07, Mon-Sun
    var month = ("0" + (new Date().getMonth() + 1)).slice(-2);  //uint8_t 0x01-0x12
    var date = ("0" + new Date().getDate()).slice(-2);        //uint8_t 0x01-0x31
    var year = String(new Date().getFullYear()).slice(-2);    //uint8_t 0x20

    var hour = new Date().getHours();    //uint8_t Hours 0x00-0x023 if RTC_HourFormat_24, 0x00 to 0x12 if RTC_HourFormat_12
    var min  = ("0" + new Date().getMinutes()).slice(-2); //uint8_t Min 0x00 to 0x59
    var sec  = ("0" + new Date().getSeconds()).slice(-2); //uint8_t Sec 0x00 to 0x59

    //uint8_t TimeFormat to 0x00 for FORMAT12_AM, 0x40 for FORMAT12_PM
    var formatAM = hour >= 12 ? 1 : 0;
    if (format12) { hour = hour % 12; hour = hour ? hour : 12;}
    hour = ("0" + hour).slice(-2);

    //uint32_t DayLightSavings; use RTC_DAYLIGHTSAVINGS_SUB1H, RTC_DAYLIGHTSAVINGS_ADD1H, or RTC_DAYLIGHTSAVING_NONE
    var daylight = new Date().isDstObserved() ? 1 : 0; // if 1, ADD1H; else NONE

    return day + month + date + year + hour + min + sec  + '0' + formatAM  + '0' + (format12 ? 1 :0) + '0' + daylight;

  }

  reverseBytes(str){
    //bytes are 2 chars long
    //both systems are Little Endian; transport protocol is Big Endian
    //thus, data always gets flipped in transit

    s = str.replace(/^(.(..)*)$/, "0$1"); // add a leading zero if needed
    var a = s.match(/../g);             // split number in groups of two
    a.reverse();                        // reverse the groups
    return a.join("");                // join the groups back together
  }


  base64ToHex(str) {
    const raw = atob(str);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
        const hex = raw.charCodeAt(i).toString(16);
        result += (hex.length === 2 ? hex : '0' + hex);
    }
    return result.toUpperCase();
  }

  hexToBase64(str) {
    return btoa(str.match(/\w{2}/g).map(function(a) {
        return String.fromCharCode(parseInt(a, 16));
    }).join(""));
  }

  sendTextToWatch(sendString){
        //remove spaces at position 13, 25 because they are line breaks
        if (sendString.charAt(12) == ' '){
            sendString = sendString.substring(0,12) + sendString.substring(13);
        }
        if (sendString.charAt(24) == ' '){
            sendString = sendString.substring(0,24) + sendString.substring(25);
        }

        //if too long, shorten and warn
        if (sendString.length > 36){
            console.log('STRING TO LONG; MUST BE LESS THAN 36 CHARS.  SHORTENING')
            sendString = sendString.substring(0,36);
        }

        //if three lines required, don't start on middle line
        //start on top line.  Reorder to handle default wrapping.
        if (sendString.length > 24){
            //rearrange so appears properly on screen; prints middle,
            //bottom, top line wrapping on the device
            sendString = sendString.substring(12) + sendString.substring(0,12)
        }

        //break into packets and send
        var sendable = (sendString.convertToHex() + '00').match(/.{1,38}/g); // 38 chars = 19 bytes, + 1 header is max 20 byte MTU size
        for (chunk of sendable){
            this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('06' + chunk));
        }
  }

  sendTimeToWatch(){
    var timestamp_string = this.getDateInBCD();
    this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('00' + timestamp_string));
  }

  sendVibrateDurationToWatch(duration=1000){
    var hex_duration = duration.toString(16);
    console.log(hex_duration);
    //if odd add a zero so we're byte aligned
    if (hex_duration.length % 2) { hex_duration = '0' + hex_duration; }
    console.log(hex_duration);
    console.log('03' + hex_duration);
    this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('03' + hex_duration));
  }

  sendLEDStateToWatch(ledstate=4){
    //ledstate => 1=off, 2=time, 3=touch, 4=flash, 5=spiral
    var hex_val = ledstate.toString(16);
    if (hex_val.length % 2) { hex_val = '0' + hex_val; }
    this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('07' + hex_val));
  }

  //Test Cases ======================================
  toggleLED(){
    console.log('toggle LED function called!')
    var newLedVal = !this.state.ledState
    if  (this.state.writeCharacteristic){
        if (newLedVal){
        this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('0101'))
        console.log('wrote ' + this.hexToBase64('0101'))
        }
        else {
        this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('0100'))
        console.log('wrote ' + this.hexToBase64('0100'))
        }
        this.setState({ledState: newLedVal})
    }
  }

  toggleLEDandDate(){
    console.log('toggle LED function called!')
    var newLedVal = !this.state.ledState
    if  (this.state.writeCharacteristic){
        if (newLedVal){ // send date update, start with 0x0000 (0x00 for device, 0x00 for timestamp)
            var timestamp_string = this.getDateInBCD();
            this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('00' + timestamp_string));
        }
        else { // send screen text update, start with 0x0001 (0x00 for device, 0x01 for screen)
            var sendString = "Testing this longsabdce f g h i j k l m n" // longest string in 1 packet

            //remove spaces at position 13, 25 because they are line breaks
            if (sendString.charAt(12) == ' '){
                sendString = sendString.substring(0,12) + sendString.substring(13);
            }
            if (sendString.charAt(24) == ' '){
                sendString = sendString.substring(0,24) + sendString.substring(25);
            }

            //if too long, shorten and warn
            if (sendString.length > 36){
             console.log('STRING TO LONG; MUST BE LESS THAN 36 CHARS.  SHORTENING')
             sendString = sendString.substring(0,36);
            }

            //if three lines required, don't start on middle line
            //start on top line.  Reorder to handle default wrapping.
            if (sendString.length > 24){
                //rearrange so appears properly on screen; prints middle,
                //bottom, top line wrapping on the device
                sendString = sendString.substring(12) + sendString.substring(0,12)
            }

            //break into packets and send
            var sendable = (sendString.convertToHex() + '00').match(/.{1,38}/g); // 38 chars = 19 bytes, + 1 header is max 20 byte MTU size
            for (chunk of sendable){
                this.state.writeCharacteristic.writeWithoutResponse(this.hexToBase64('06' + chunk));
            }
        }
        this.setState({ledState: newLedVal})
    }
  }
 //End Test Cases ======================================

  componentDidMount() {
    if (Platform.OS === 'ios') {
      this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') this.scanAndConnect()
      })
    } else {
      this.scanAndConnect()
    }
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null,
                                 null, (error, device) => {
      this.info("Scanning...")
      //console.log(device)

      if (error) {
        this.error(error.message)
        return
      }

      this.ble_devices[device.id] = {
            'name': device.name,
            'rssi': device.rssi
      }

      if (device.name === 'DRAMSAY' || device.name === 'HRSTM' || device.name === 'P2PSRV1') {
        this.info("connecting to " + device.name)
        this.manager.stopDeviceScan()
        device.connect()
          .then((device) => {
            this.info("Discovering services and characteristics")
            let r = device.discoverAllServicesAndCharacteristics()
            console.log(r)
            return r
          })
          .then((device) => {
            console.log('services')
            device.services()
              .then((services) => {
                  console.log(services)
                  console.log('characteristics')
                  for (s in services){
                      console.log(services[s])
                      device.characteristicsForService(services[s].uuid).then((c)=> {
                          for (i in c){
                              console.log(c[i])
                              if (c[i].isNotifiable){
                                  console.log('registering notifiable!!')
                                  device.monitorCharacteristicForService(c[i].serviceUUID, c[i].uuid, (error, characteristic) => {
                                  if (error) {
                                    console.log(error.message)
                                    this.error(error.message)
                                    return
                                  }
                                  this.updateValue(characteristic.uuid, characteristic.value)
                                  });
                              }
                              if (c[i].isWritableWithoutResponse){
                                  console.log('saving characteristic that is writable!!')
                                  this.setState({writeCharacteristic: c[i]})
                              }
                          }
                      })
                }
            })
          })
          .then(() => {
              this.info("Listening")
          }, (error) => {
              this.error(error.message)
              this.info(error.message)
          })
      }
    })
  }

  render() {
    return (
      <View>

        <Text>{this.state.info}</Text>
        <TextInput
        style={{ height: 40, marginTop: 10, borderColor: 'gray', borderWidth: 1 }}
        onChangeText={(text) => this.setState({input: text})}
        value={this.state.input}
        />
        <Button
        title="Send Text"
        color="#010101"
        onPress={this.SendText.bind(this)}
        />
        <Button
        title="Update Time"
        color="#010101"
        onPress={this.UpdateTime.bind(this)}
        />
        <Button
        title="LED Mode Toggle"
        color="#010101"
        onPress={this.LEDPress.bind(this)}
        />
        <Button
        title="Vibrate Toggle"
        color="#010101"
        onPress={this.VibrateToggle.bind(this)}
        />

        {Object.keys(this.ble_devices).map((key) => {
            return <View key={key}>
                <Text style={{fontWeight:'bold',color:'red'}}>
                    {this.ble_devices[key]['name'] + ' : ' + this.ble_devices[key]['rssi']}
                </Text>
                <Text key={key}>
                {key}
                </Text>
                </View>
        })}

        {Object.keys(this.state.values).map((key) => {
          return <Text key={key}>
                   {"\n" + key + ": " + (this.state.values[key])}
                 </Text>
        })}

        {this.state.values['0000fe42-8e22-4541-9d4c-21edae82ed19']=='0101'
            ?
            <Text> Button Pushed
            </Text>
            :
            <Text> Button NOT Pushed
            </Text>
        }

        <TouchableHighlight style={{borderColor: this.state.ledState ? 'green' : 'red', borderWidth: 4, borderRadius: 10, height:30, width:100, justifyContent:'center', alignItems:'center'}} onPress={this.toggleLEDandDate.bind(this)} >
            <Text>LED IS {this.state.ledState ? 'on' : 'off'}</Text>
        </TouchableHighlight>

        {this.state.running_vals.map((val) => {
          return <Text key={val}>
                   {"\n" + val}
                 </Text>
        })}
      </View>
    )

  }
};

