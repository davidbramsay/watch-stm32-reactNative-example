/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Button,
  Text,
  TextInput,
  StatusBar,
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import BLE from './BLE';
import WatchState from './WatchState';





//const App: () => React$Node = () => {
export default class App extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      input: 'text to send',
      watchState: {
        text:'Text from the watch screen will be displayed here',
        buttons:[false, false ,false],
        dial_loc:10,
        dial_intensity:6,
        vibration:0
      }
    };
  }


  UpdateButton(buttonNum){
    let buttons = [...this.state.watchState.buttons];
    buttons[buttonNum] = !buttons[buttonNum];
    this.setState({
        watchState: {
            ...this.state.watchState,
            buttons: buttons
        }
    });
  }

  UpdateScreen(val, textString, format12=false){
   if (val == '0') {
        textString = "OFF"
   } else if (val == '1') {

        var hour = new Date().getHours();
        var min  = ("0" + new Date().getMinutes()).slice(-2);
        var formatAM = hour >= 12 ? 1 : 0;
        if (format12) { hour = hour % 12; hour = hour ? hour : 12;}
        textString = hour + ':' + min

   } else if (val == '2') {
        textString = "TOUCH FEEDBACK"
   } else if (val == '4') {
        textString = "IMAGE"
   }

   console.log('updating watch text ' + textString);
   this.setState({
        watchState: {
            ...this.state.watchState,
            text: textString
        }
   });
  }

  UpdateVibrate(val){
    this.setState({
            watchState: {
                ...this.state.watchState,
                vibration: val
            }
    });

  }

  TouchEvent(angle){
   if (angle==-1){
     this.setState({
        watchState: {
            ...this.state.watchState,
            dial_intensity:0
     }
     });
   }else{
     this.setState({
        watchState: {
            ...this.state.watchState,
            dial_loc: angle,
            dial_intensity: 5
     }
     });
   }
  }

  render() {
    return (
    <>
    <StatusBar barStyle="dark-content" />
    <SafeAreaView>
    <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}>
        <WatchState watch={this.state.watchState}/>

        <BLE updateButton={this.UpdateButton.bind(this)}
             updateScreen={this.UpdateScreen.bind(this)}
             updateVibrate={this.UpdateVibrate.bind(this)}
             touchEvent={this.TouchEvent.bind(this)}
             sendTextToWatch={sendTextToWatch => this.sendTextToWatch = sendTextToWatch}/>
    </ScrollView>
    </SafeAreaView>
    </>
    );
  }
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

//export default App;
