import React, { Component }  from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Dimensions,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableHighlight
} from 'react-native';

export default class WatchState extends Component {

  constructor(props) {
    //pass in over props:
      //buttons: [0,0,0] 0=off, 1=on
      //dial_loc: 0 0-60 integer representing minute on dial
      //dial_intensity: 0 0-10 integer representing intensity of press
      //vibration: 0 0=off, 1=on
      //text: string of what is on the screen
    super(props)
  }

  render() {
      return (

  <View
   style = {{
        flex:1,
        alignItems:'center',
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width *.9
   }}
  >
    {/* outer circle */} 
     <View
      style = {{
        borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2,
        width: Dimensions.get('window').width * 0.8,
        height: Dimensions.get('window').width * 0.8,
        backgroundColor:'#C0C0C0',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor:'#202020',
        borderBottomWidth:4,
        borderTopWidth:1,
        borderLeftWidth:2,
        borderRightWidth:3,
        shadowRadius:5,
        shadowOpacity:.5

      }}
      underlayColor = '#ccc'
    >

    {/* inner circle */} 
     <View
      style = {{
        borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2,
        width: Dimensions.get('window').width * 0.5,
        height: Dimensions.get('window').width * 0.5,
        backgroundColor:'#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 1,
        borderColor:'#202020',
        borderBottomWidth:4,
        borderTopWidth:1,
        borderLeftWidth:2,
        borderRightWidth:3
      }}
      underlayColor = '#ccc'
    >
        {/* screen textbox */}
        <Text
         style = {{
            backgroundColor:'#FFF',
            textAlign:'center',
            fontSize:10,
            padding:4,
            width: '90%',
            marginTop:35,
            height: 35,
            flexShrink: 1,
            shadowRadius:1,
            shadowOpacity:.1
        }}
        >
            {this.props.watch.text}
        </Text> 
        {/* end screen textbox */}

        {/* buttons */}
        <View
        style = {{ marginTop:8, flexDirection:'row', display:'flex' }}>
        <View
        style = {{
            borderRadius: Dimensions.get('window').width*.125,
            width: Dimensions.get('window').width * 0.125,
            height: Dimensions.get('window').width * 0.125,
            backgroundColor: this.props.watch.buttons[0] ? '#2E2E2E' : '#FFAEB1',
        }}
        ></View>
        {/* end button 1 */}
        <View
        style = {{
            marginLeft:2,
            marginRight:2,
            borderRadius: Dimensions.get('window').width*.125,
            width: Dimensions.get('window').width * 0.125,
            height: Dimensions.get('window').width * 0.125,
            backgroundColor: this.props.watch.buttons[1] ? '#2E2E2E' : '#FFAEB1',
        }}
        ></View>
        {/* end button 2 */}
        <View
        style = {{
            borderRadius: Dimensions.get('window').width*.125,
            width: Dimensions.get('window').width * 0.125,
            height: Dimensions.get('window').width * 0.125,
            backgroundColor: this.props.watch.buttons[2] ? '#2E2E2E' : '#FFAEB1',
        }}
        ></View>
        {/* end button 3 */}
        </View>
        {/* end buttons */}


    </View>
    {/* end inner circle */}

    {/* touch indicator */}
     <View
      style = {{
        position: 'absolute',
        top: Dimensions.get('window').width * (0.8 * 0.5 - 0.075) - Math.cos(Math.PI*(this.props.watch.dial_loc*6)/180)*Dimensions.get('window').width*(0.25+0.075),
        left: Dimensions.get('window').width * (0.8  * 0.5 - 0.075) + Math.sin(Math.PI*(this.props.watch.dial_loc*6)/180)*Dimensions.get('window').width*(0.25+0.075),
        borderRadius: Dimensions.get('window').width * 0.15,
        width: Dimensions.get('window').width * 0.15,
        height: Dimensions.get('window').width * 0.15,
        backgroundColor:'#000000',
        opacity:.5*this.props.watch.dial_intensity/10
      }}
    ></View>
    {/* end touch indicator */}

    </View>
    {/* end outer circle */}

    {/* vibration indicator */}
    {this.props.watch.vibration ?
     <View
      style = {{
        width: Dimensions.get('window').width * 0.3,
        height: Dimensions.get('window').width * 0.1,
        backgroundColor:'#F00000',
        color:'#000000',
        justifyContent: 'center',
        alignSelf:'flex-end',
        alignItems: 'center',
        flexShrink: 1,
        marginRight:10,
        borderColor:'#202020',
        borderBottomWidth:1,
        borderTopWidth:1,
        borderLeftWidth:1,
        borderRightWidth:1
      }}>
        <Text style ={{color:'#FFFFFF'}}> VIBRATION! </Text>

    </View> : null}
    {/* end vibration indicator */}


  </View>
  )}

}


