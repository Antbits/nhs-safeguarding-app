import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  AppState,
  Pressable,
  Alert,
  Dimensions,
  Animated,
  Platform,
  BackHandler
} from 'react-native';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import {
  Colors
} from 'react-native/Libraries/NewAppScreen';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from  "react-native-splash-screen";
import Navigation from './components/Navigation';
import WebViewer from './components/WebViewer';
const projectId = 'safeguarding_dev'
const webpath = (Platform.OS === 'android'
  ? 'file:///android_asset/'
  : ''
);
const isPortrait = () => {
  const dim = Dimensions.get('screen');
  return dim.height >= dim.width;
};
const getHeight = () => {
  var h = 0;
  if (Platform.OS === 'android') {
    h = ExtraDimensions.getRealWindowHeight() - (ExtraDimensions.getStatusBarHeight()-2)
  } else {
    h = Dimensions.get('window').height-24
  }
  return h
}

const storeData = async (value) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(projectId, jsonValue)
  } catch (e) {
    console.log(e)
  }
}
const getData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(projectId)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.log(e)
  }
}


export default class App extends React.Component {
 componentDidMount() {
    SplashScreen.hide();
    //if (Platform.OS === 'ios') {
      this.navigationRef.current.setScaling()
      this.appStateSubscription = AppState.addEventListener(
        "change",
        nextAppState => {
          if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === "active"

          ) {
            this.navigationRef.current.setScaling()
            this.webViewerRef.current.setScaling()
            this.webViewerRef.current.wakeUp()
            this.analyticsEvt({'a':'app_open'})

          }
            this.setState({ appState: nextAppState });
          }
        );
     // }
    }
  componentWillUnmount() {
    if (Platform.OS === 'ios') {
      if(this.appStateSubscription != null){
        this.appStateSubscription.remove();
      }
    }
  }
  constructor(props) {
    super(props);
    this.state = {
      surveyData: [],
      settings:{'data_collection':true},
      closeBtnVisible: false,
      appState: AppState.currentState,
      winHeight: getHeight(),
      winWidth:  Dimensions.get('window').width
    };
    this.navigationRef = React.createRef();
    this.webViewerRef = React.createRef();
    this.slideYAnim = new Animated.Value(-90);
    this.dataObj = getData()
    this.dataObj.then((data) => {
      if (data === null) {
        data = {};
        this.showAlert();
      }else if (!data.hasOwnProperty('settings')) {
          this.showAlert();
      }
      if (data.hasOwnProperty('surveyData')) {
        this.setState({ surveyData: data.surveyData }, function () {
          this.toggleSurveyNotification();
        })
      } else {
        this.toggleSurveyNotification()
      }
      if (data.hasOwnProperty('settings')) {
        this.setState({ settings: data.settings })
      }
      storeData(this.state)
    })
    this.saveSettings = () => {
      storeData(this.state);
    }
    this.toggleSurveyNotification = () => {
      /*if (this.state.surveyData.length === 0 && this.navigationRef.current.state.history.length <= 1) {
        this.slideUp()
      } else {
        this.slideDown()
      }*/
    }
    BackHandler.addEventListener('hardwareBackPress', function () {
      if(this.navigationRef.current.state.history.length > 1){
        this.navigationRef.current.backEvent();
        return true;
      }else{
        return false;

      }
      
    }.bind(this))
    Dimensions.addEventListener('change', () => {
      this.setState({
        orientation: isPortrait() ? 'portrait' : 'landscape',
        winHeight: getHeight(),
        winWidth:  Dimensions.get('window').width
      }, function () {
        this.webViewerRef.current.setOrientation(getHeight())
      });
    });
    this.analyticsEvt = (obj) => {
      if(this.state.settings.data_collection){
        obj['plat'] = Platform.OS === 'ios'?'IPhone OS' : 'Android'
        obj['id'] = 'Safeguarding-App';
        obj['cv'] = 569
        var output = "https://preview.antbits.com/tracking/tracker.gif?";
        for(var key in obj){
          output+=key+'='+obj[key]+'&';
        }
		    output = output.slice(0,-1);
        console.log(output)
        fetch(output)
        
      }

    }
    this.slideUp = () => {
      Animated.timing(this.slideYAnim, {
        ...Platform.select({
          ios: {
            toValue: -5,
          },
          android: {
            toValue: 40,
          },
        }),
        duration: 300,
        useNativeDriver: false
      }).start();
    };
    this.slideDown = () => {
      Animated.timing(this.slideYAnim, {
        ...Platform.select({
          ios: {
            toValue: -90,
          },
          android: {
            toValue: -90,
          },
        }),
        duration: 300,
        useNativeDriver: false
      }).start();
    };
    this.submitSurvey = (data) => {
      var tmp = this.state.surveyData;
      data.action = 'send';
      data.timestamp = new Date();
      data.withdraw_id = null;
      tmp.push(data)
      this.setState({ surveyData: tmp }, function () {
        storeData(this.state)
        this.sendSurveys()
      }.bind(this))

    }
    this.withdrawSurvey = (data) => {
      var surveys = this.state.surveyData
      var i = 0;
      surveys.forEach(element => {
        if (element.withdraw_id === data.id) {
          surveys[i].action = 'withdraw'
          this.setState({ surveyData: surveys }, function () {
            storeData(this.state);
            this.sendSurveys()
          })
        }
      })

    }
    this.getSurveys = () => {
      return this.state.surveyData;
    }
    this.navSurvey = () => {
      this.webViewerRef.current.navSurvey()

    }
    this.showAlert=()=>{
      var tmp = this.state.settings;
      Alert.alert(
        "Data Collection",
        "NHS Safeguarding would like your permission to collect some information on how the app is used to help make ongoing improvements. Please be assured, no personal data is requested or collected.",
        [
          {
            text: "Allow",
            onPress: () => {
              tmp['data_collection'] = true;
              this.analyticsEvt({'a':'app_install'})
              this.setState({'settings':tmp},function(){
                this.saveSettings();
              })
            },
          },
          {
            text: "Deny",
            onPress: () => {
              tmp['data_collection'] = false;
              this.setState({'settings':tmp},function(){
                this.saveSettings();
              })
            },
          },
        ]
      );
    }

    this.sendSurveys = () => {
      const api = 'https://www.myguideapps.com/admin/modules/survey/survey.api.php';
      NetInfo.fetch().then(state => {
        if (state.isConnected) {
          var surveys = this.state.surveyData
          var i = 0;
          surveys.forEach(element => {
            switch (element.action) {
              case 'send':
                var output = api + '?project_id=' + projectId + '&index=' + i + '&form_data=' + encodeURIComponent(JSON.stringify(element));
                console.log(output)
                fetch(output).then(
                  response => response.json()
                ).then(
                  data => {
                    surveys[data.index].action = null
                    surveys[data.index].withdraw_id = data.withdraw_id
                    this.setState({ surveyData: surveys }, function () {
                      storeData(this.state);
                    })
                  }
                )
                break;
              case 'withdraw':
                var output = api + '?project_id=' + projectId + '&index=' + i + '&withdraw_id=' + element.withdraw_id;
                fetch(output).then(
                  response => response.json()
                ).then(
                  data => {
                    if (data.success) {
                      surveys.splice(data.index, 1)
                      this.setState({ surveyData: surveys }, function () {
                        storeData(this.state);
                        this.webViewerRef.current.webview.injectJavaScript("module_obj.setSurveys(" + JSON.stringify(this.state.surveyData) + ");");

                      })

                    }
                  }
                )
                break;
            }
            i++;
          });
        }
      });
    }
    setInterval(function () {
      this.sendSurveys()
    }.bind(this), 60000)
    this.sendSurveys()
  }

  render() {
    StatusBar.setBarStyle("dark-content", true);
    return (
      <>
        <StatusBar barStyle="dark-content" translucent backgroundColor="#fff"  />
        <SafeAreaView>
          <View style = {styles.IOSHeader}></View>
          <View style={[styles.Container,{height:this.state.winHeight}]}>
          <View style={styles.Navigation}>
            <Navigation ref={this.navigationRef} projectId={projectId} webViewerRef={this.webViewerRef} analyticsEvt = {this.analyticsEvt} toggleSurveyNotification={this.toggleSurveyNotification}></Navigation>
          </View>
          {/*<Animated.View style={[
            styles.Webview, {
              marginBottom: this.slideYAnim
            }
          ]}>*/}
            <WebViewer 
              ref={this.webViewerRef} 
              projectId={projectId} 
              saveSettings = {this.saveSettings} 
              navigationRef={this.navigationRef} 
              analyticsEvt = {this.analyticsEvt}  
              parentRef={this} 
              submitSurvey={this.submitSurvey} 
              withdrawSurvey={this.withdrawSurvey} 
              winHeight={this.state.winHeight}
              getSurveys={this.getSurveys}>
            </WebViewer>
            {/*<Pressable style={styles.SurveyBtn} onPress={this.navSurvey}><Text style={styles.SurveyBtnText} >Have your say{"\n"}Feedback on the app</Text></Pressable>
          </Animated.View>*/}
        </View>
        </SafeAreaView>
        {this.state.closeBtnVisible && (<Pressable style={styles.closeBtn} onPress={() => this.webViewerRef.current.slideDown(false)}></Pressable>)}
      </>
    );
  }
}
const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter
  },
  engine: {
    position: 'absolute',
    right: 0
  },
  body: {
    backgroundColor: '#F1F4F5'
  },
  SurveyBtn: {
    backgroundColor: '#FFeb3b',
    alignItems: "center",
    height: 80,
    justifyContent: "center",
    width: '100%',
    paddingBottom: 15,
    borderTopColor: '#212B32',
    borderTopWidth: 3
  },
  SurveyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: "center"
  },
  IOSHeader:{
    top:-60,
    height:60,
    width:'100%',
    backgroundColor:'#FFF'
  },
  Container: {
    width:'100%',
    top:-60,
    backgroundColor:'#F1F4F5'
  },
  Navigation: {
    ...Platform.select({
      android: {
        backgroundColor:'#FFF',
        paddingTop:44
      }
    })
  },
  Webview: {
    flex: 1
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 60,
    width: 60
  }
});