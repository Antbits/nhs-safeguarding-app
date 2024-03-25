import React from 'react';
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  Linking,
  Animated,
  PixelRatio,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
const isTablet = DeviceInfo.isTablet();
const webpath = (Platform.OS === 'android'
  ? 'file:///android_asset/'
  : ''
);
var scaling = PixelRatio.getFontScale();
var last_area = null;

class WebViewer extends React.Component {
  constructor(props) {
    super(props);
    this.webview = null;
    this.nativePath = null;
    this.init = false;
    this.handleMessage = this.handleMessage.bind(this);
    this.goBack = this.goBack.bind(this);
    this.goHome = this.goHome.bind(this);
    this.wakeUp = this.wakeUp.bind(this);
    this.goMore = this.goMore.bind(this);
    this.search = this.search.bind(this);
    this.launchPDF = this.launchPDF.bind(this);
    this.setScaling = this.setScaling.bind(this);
    this.navSurvey = this.navSurvey.bind(this);
    this.navigate = this.navigate.bind(this);
    this.setOrientation = this.setOrientation.bind()
    this.state = {
      sourceUri: webpath + 'Web.bundle/default/index.html',
      searchStr: null,
      variant: 'default',
      overlayHeight: Dimensions.get('window').height,
      subdir: '/',
      alphaAnim: new Animated.Value(1),
      slideYAnim: new Animated.Value(Dimensions.get('window').height),
      slideWebviewAnim: new Animated.Value(0),
      fadeWebviewAnim: new Animated.Value(1),
    }
  }

  setScaling() {
    scaling = PixelRatio.getFontScale();
    var s = scaling;
    if (isTablet) {
      s = s * 1.1875
    }
    this.webview.injectJavaScript('app_obj.scale(' + s + ');');
  }
  setOrientation = (h) => {
    this.setState({ overlayHeight: h }, function () {
      Animated.timing(this.state.slideYAnim, {
        toValue: h,
        duration: 300,
        useNativeDriver: false
      }).start();
    }.bind(this))
  }
  fadeOutIn = () => {
    Animated.sequence([
      Animated.timing(this.state.alphaAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      function () {
        //console.log('halfway')
      },
      Animated.timing(this.state.alphaAnim, {
        toValue: 1,
        delay: 600,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }
  slideUp = () => {
    this.setState({ overlayHeight: Dimensions.get('window').height }, function () {
      var redirectTo = 'window.location = "' + this.nativePath + '/' + this.state.variant + '/feedback/survey/form.html"';
      Animated.sequence([
        Animated.timing(this.state.alphaAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: false
        }),
        Animated.timing(this.state.slideYAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: false
        })
      ]).start();
      Animated.timing(this.state.alphaAnim, {
        toValue: 0,
        delay: 450,
        duration: 300,
        useNativeDriver: false
      }).start(function () {
        this.setState({ overlayHeight: 0 })
        this.props.parentRef.setState({ closeBtnVisible: true })
      }.bind(this));
      setTimeout(() => {
        this.webview.injectJavaScript(redirectTo)
      }, 300)
    }.bind(this))
  };

  slideDown = (completed) => {
    this.setState({ overlayHeight: Dimensions.get('window').height }, function () {
      Animated.timing(this.state.slideYAnim, {
        toValue: this.state.overlayHeight,
        duration: 300,
        useNativeDriver: false
      }).start();
      Animated.sequence([
        Animated.timing(this.state.slideWebviewAnim, {
          toValue: this.state.overlayHeight,
          duration: 300,
          useNativeDriver: false
        }),
        Animated.timing(this.state.fadeWebviewAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false
        }),
        Animated.timing(this.state.slideWebviewAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false
        }),
        Animated.timing(this.state.fadeWebviewAnim, {
          toValue: 1,
          delay: 200,
          duration: 300,
          useNativeDriver: false
        }),
      ]).start(function () {
        this.setState({ overlayHeight: 0 })
        this.props.parentRef.setState({ closeBtnVisible: false })
      }.bind(this));
      setTimeout(() => {
        if (completed) {
          this.props.navigationRef.current.homeEvent()
        } else {
          var redirectTo = 'window.location = "' + this.nativePath + '/' + this.state.variant + '/feedback/survey/index.html"';
          this.webview.injectJavaScript(redirectTo)
        }

      }, 300)
    }.bind(this))

  };
  handleMessage(data) {
    // alert(data)
    data = JSON.parse(data);
    //
    this.setScaling();
    switch (data.action) {

      case 'init':
        var tintIndex = data.subsection
        if (data.subsection == null || data.subsection == 'null' || data.subsection == -1) {
          tintIndex = 0
          data.area = 0
        }
        if (data.destination.indexOf('/contact/') > -1) {
          tintIndex = 5
          data.area = 5
        }
        this.props.navigationRef.current.setState({ 'tintIndex': tintIndex })
        if (data.level === 0 && data.filename === 'index.html' && !this.init) {
          this.init = true
          this.props.navigationRef.current.setNavState(data.destination, 0, 0, 0)
          this.props.navigationRef.current.configure(data.config)
          this.nativePath = data.destination.split('/default/')[0]
        } else {
          this.props.navigationRef.current.setNavState(null, data.level, data.area, 0)
        }

        if (data.filename === 'search.html' && this.state.searchStr !== null) {
          this.webview.injectJavaScript('app_obj.renderSearchResult("' + this.state.searchStr + '");');
        }
        if (this.scrollto > 0) {
          this.webview.injectJavaScript('window.scrollTo(0, ' + this.scrollto + ');');
          this.scrollto = 0;
        }
        if (data.formItems.length > 0) {
          for (var i in data.formItems) {
            var tmp = this.props.parentRef.state.settings[data.formItems[i].id]
            switch (data.formItems[i].type) {
              case 'checkbox':
                if (tmp) {
                  this.webview.injectJavaScript('app_obj.setFormElement({"type":"' + data.formItems[i].type + '","id":"' + data.formItems[i].id + '","value":true});');
                }
                break;
            }
          }
        }
        this.setState({ 'subdir': data.subdir });
        break;
      case 'form_element':
        var tmp = this.props.parentRef.state.settings
        tmp[data.obj.id] = data.obj.value;
        this.props.parentRef.setState({ 'settings': tmp }, function () {
          this.props.saveSettings();
        }.bind(this))
        break;
      case 'modal_launch':
        break;
      case 'modal_die':
        break;
      case 'pdf':
        this.launchPDF(data.destination)
        //Linking.openURL(data.destination);
        break;
      case 'tel':
        Linking.openURL(data.destination);
        break;
      case 'email':
        Linking.openURL(decodeURIComponent(data.destination));
        break;
      case 'external':
        Linking.openURL(data.destination);
        break;
      case 'rate_app':
        this.props.navigationRef.current.rateApp()
        break;
      case 'share_app':
        this.props.navigationRef.current.shareApp()
        break;
      case 'submit_survey':
        this.props.submitSurvey(data.data)
        this.navigate(data, false);
        break;
      case 'withdraw_survey':
        this.props.withdrawSurvey(data)
        break;
      case 'close_survey':
        this.slideDown(true);
        break;
      case 'redirect_survey':
        this.slideDown(false);
        break;
      case 'get_surveys':
        this.webview.injectJavaScript("module_obj.setSurveys(" + JSON.stringify(this.props.getSurveys()) + ");");
        break;
      case 'navigate':
        this.navigate(data, false);
        break;
    }
  }
  launchPDF(path) {
    var tmp = path.split('Web.bundle/' + this.state.variant)
    path = 'https://www.myguideapps.com/projects/safeguarding/default' + tmp[1]
    console.log(path)
    Linking.openURL(path);
  }
  modalLaunch(path) {
    this.slideUp();
  }
  wakeUp() {
    //this.webview.injectJavaScript('location.reload();');
  }
  goHome() {
    this.navigate({
      destination: this.nativePath + "/" + this.state.variant + "/index.html",
      level: 0,
      area: 0
    }, false)
  }
  goMore() {
    this.navigate({
      destination: this.nativePath + "/" + this.state.variant + "/more/index.html",
      level: 0,
      area: 0
    }, false)
  }
  goBack(history) {
    this.navigate({ destination: history[0], scrollpos: history[1] }, true)
  }
  navSurvey() {
    this.navigate({
      destination: this.nativePath + "/" + this.state.variant + "/feedback/survey/index.html",
      level: 0,
      area: 0
    }, false)
  }
  search(str) {
    var searchContext = '/'
    this.setState({ 'searchStr': str });
    if (this.state.subdir === '/contact/') {
      searchContext = this.state.subdir
    }
    this.navigate({
      destination: this.nativePath + "/" + this.state.variant + searchContext + "search.html",
      level: 0,
      area: 0
    }, false)
  }
  navigate(data, back) {
    var path = data.destination
    var ext = path.split('.').pop()
    var sub_path = path.split('/Web.bundle/')[1];
    var level = sub_path.split('/').length - 2;
    if (level === 0) {
      last_area = null;
    }
    if (level === 1 && last_area === null) {
      this.props.analyticsEvt({ 'a': 'app_navigate', 'p': sub_path });
    }
    if (level === 2) {
      var l1 = sub_path.split('/')[1];
      var l2 = sub_path.split('/')[2];
      var l3 = sub_path.split('/')[3];
      this.props.analyticsEvt({ 'a': 'app_content', 'l1': l1, 'l2': l2, 'l3': l3 });
    }
    if (sub_path.indexOf('search.html') > -1) {
      this.props.analyticsEvt({ 'a': 'app_navigate', 'p': sub_path });
    }
    if (sub_path.indexOf('/contact.') > -1) {
      this.props.analyticsEvt({ 'a': 'app_content', 'p': sub_path });
    }
    if (ext.toLowerCase() === 'pdf') {
      Linking.openURL(path)
    } else if (path.slice(0, 4) === 'http' || path.slice(0, 4) === 'www.') {
      Linking.openURL(path)
    } else if (path.indexOf('feedback/survey/form.html') > -1) {
      this.modalLaunch(path)
    } else {
      this.scrollto = 0;
      if (path.slice(-1) === '/') {
        path += 'index.html';
      }
      var redirectTo = 'window.location = "' + path + '";';
      if (!back) {
        this.props.navigationRef.current.setNavState(path, data.level, data.area, data.scrollpos)
      } else if (data.scrollpos > 0) {
        this.scrollto = data.scrollpos
      }
      this.webview.injectJavaScript(redirectTo);
    }
  }
  render() {
    return (
      <View style={styles.webviewWrap}>
        <Animated.View style={styles.webviewUnderlayBody}></Animated.View>
        <Animated.View style={[styles.webviewWrap, { top: this.state.slideWebviewAnim, opacity: this.state.fadeWebviewAnim }]}>
          <WebView
            ref={(ref) => (this.webview = ref)}
            source={{ uri: this.state.sourceUri }}
            javaScriptEnabled={true}
            originWhitelist={['*']}
            allowFileAccess={true}
            onMessage={event => {
              const { data } = event.nativeEvent;
              this.handleMessage(data);
            }}
          />
        </Animated.View>
        <Animated.View style={[styles.webviewOverlayBody, { top: this.state.slideYAnim, opacity: this.state.alphaAnim, height: this.state.overlayHeight }]}></Animated.View>
        <Animated.View style={[styles.webviewOverlayHeader, { top: this.state.slideYAnim }]}>
          <View style={styles.header}>
            <Pressable onPress={() => this.slideDown(false)} style={styles.closeBtn}><Image style={styles.btnImg} source={require('./../images/close_icon.png')} /></Pressable>
            <Image style={styles.headerBranding} source={require('./../images/nhs_logo.png')} />
            <View style={styles.defaultBorder}></View>
          </View>
        </Animated.View>
      </View>

    );
  }
}
const styles = StyleSheet.create({
  webviewWrap: {
    flex: 1
  },
  webviewOverlayHeader: {
    position: "absolute",
    width: '100%',
    height: 60
  },
  webviewUnderlayBody: {
    top: 0,
    position: "absolute",

    width: '100%',
    backgroundColor: '#F1F4F5'
  },
  webviewOverlayBody: {
    position: "absolute",

    width: '100%',
    backgroundColor: '#F1F4F5'
  },
  header: {
    position: "absolute",
    width: "100%",
    backgroundColor: '#FFFFFF',
    height: 60,
    alignItems: "center"
  },
  headerBranding: {
    height: 24.3,
    width: 61,
    top: 18
  },
  defaultBorder: {
    height: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#CCC'
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 60,
    width: 60
  },
  btnImg: {
    width: '100%',
    height: '100%'
  },
});

export default WebViewer;