import React from 'react';
import FadeInOut from 'react-native-fade-in-out';
import DeviceInfo from 'react-native-device-info';
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  Animated,
  TextInput,
  PixelRatio,
  Text,
  Keyboard,
  Share,
  Platform,
  Linking
} from 'react-native';
const isTablet = DeviceInfo.isTablet();
class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.backEvent = this.backEvent.bind(this);
    this.nativePath = '';
    this.clearEvent = this.clearEvent.bind(this);
    this.cancelEvent = this.cancelEvent.bind(this);
    this.showCancel = this.showCancel.bind(this);
    this.hideCancel = this.hideCancel.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
    this.homeEvent = this.homeEvent.bind(this);
    this.moreEvent = this.moreEvent.bind(this);
    this.rateApp = this.rateApp.bind(this);
    this.shareApp = this.shareApp.bind(this);
    this.setScaling = this.setScaling.bind(this);
    this.configure = this.configure.bind(this);
    this.setTint = this.setTint.bind(this);
    this.setNavState = this.setNavState.bind(this);
    this.state = {
      history: [],
      path: '/default/index.html',
      config: { tints: ['#FFF'] },
      colorFrom: "#FFF",
      colorTo: "#F0F",
      tintAnim: new Animated.Value(0),
      slideYAnim: new Animated.Value(100),
      slideXAnim: new Animated.Value(0),
      level: 0,
      area: 0,
      searchState: true,
      searchText: "",
      tintIndex: 0,
      scaling: PixelRatio.getFontScale(),
      cancelBtnState: false,
      home: false
    };
  }
  setScaling() {
    this.setState({ 'scaling': PixelRatio.getFontScale() }, function () {
      if (this.state.cancelBtnState) {
        this.slideLeft()
      } else {
        this.slideRight()
      }
    })
  }
  backEvent() {
    if (this.state.history.length > 1) {
      var tmp = this.state.history;
      tmp.pop()
      this.props.webViewerRef.current.goBack(tmp[tmp.length - 1])
      this.setState({ "history": tmp }, function () {
        this.setTint()
      })
    }
  }
  clearEvent() {
    this.setState({ "searchText": "" })
  }
  cancelEvent() {
    this.slideRight();
    Keyboard.dismiss();
  }
  showCancel() {
    if (!this.state.cancelBtnState && Platform.OS !== 'android') {
      this.slideLeft()
    }
  }
  hideCancel() {
    if (this.state.cancelBtnState && Platform.OS !== 'android') {
      this.slideRight()
    }
  }
  homeEvent() {
    console.log('homeEvent')
    this.setState({ history: [], area: 0, level: 0, searchState: true }, function () {
      this.setTint();
      this.props.webViewerRef.current.goHome();
    })

  }
  moreEvent() {
    console.log('moreEvent')
    this.props.webViewerRef.current.goMore();
  }
  submitSearch() {
    if (this.state.searchText.length > 2) {
      this.props.webViewerRef.current.search(this.state.searchText)
    }
  }
  rateApp() {
    if (Platform.OS === 'ios') {
      Linking.openURL(this.state.config.store_urls['iOS_review'])
    } else {
      Linking.openURL(this.state.config.store_urls['android_review'])
    }
  }
  shareApp() {
    var result
    try {
      if (Platform.OS === 'ios') {
        var result = Share.share({
          url: this.state.config.store_urls['iOS']
        });
      } else {
        var result = Share.share({
          message: this.state.config.store_urls['android']
        });
      }
      /*if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }*/
    } catch (error) {
      alert(error.message);
    }
  }
  tintIn = () => {
    Animated.timing(this.state.tintAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  tintOut = () => {
    Animated.timing(this.state.tintAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false
    }).start();
  };
  slideUp = () => {
    Animated.timing(this.state.slideYAnim, {
      toValue: 53,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  slideDown = () => {
    Animated.timing(this.state.slideYAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: false
    }).start();
  };
  slideLeft = () => {
    Animated.timing(this.state.slideXAnim, {
      toValue: 16 + (55 * this.state.scaling),
      duration: 300,
      useNativeDriver: false
    }).start(function () {
      this.setState({ 'cancelBtnState': true })
    }.bind(this));
  };

  slideRight = () => {
    Animated.timing(this.state.slideXAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false
    }).start(function () {
      this.setState({ 'cancelBtnState': false })
    }.bind(this));
  };

  setTint() {
    if (this.state.path.indexOf('/default/index.html') > -1 || this.state.path.indexOf('contact/index.html') > -1 || this.state.path.indexOf('/search.html') > -1) {
      this.slideDown();
      if (this.state.path.indexOf('/contact/') === -1) {
        this.tintOut();
      } else {
        this.setState({ "colorTo": this.state.config.tints[this.state.config.tints.length - 1] }, function () {
          this.tintIn();
        })

      }
    } else if (this.state.level === 0 || this.state.area === 0) {
      this.slideUp();
      this.tintOut();
    } else {
      this.setState({ "colorTo": this.state.config.tints[Math.min(this.state.tintIndex, this.state.config.tints.length)] }, function () {
        this.tintIn();
      })
      this.slideUp();
    }
  }
  configure(data) {
    this.setState({ "config": data })
  }
  setNavState(path, level, area, scrollpos) {
    var tmp = this.state.history;
    if (tmp.length > 0) {
      tmp[tmp.length - 1][1] = scrollpos
    }
    var homeVal = this.state.home
    if (level > 1) {
      homeVal = true
    }
    var searchState = false;
    if (path !== null) {
      tmp.push([path, 0]);
      if (level <= 1) {
        homeVal = false
      }
      if (path.indexOf('/contact/') > -1) {
        homeVal = true
      }
      if (path.indexOf('contact/search.html') > -1) {
        homeVal = true
      }
      if (path.indexOf('/contact.index.html') > -1) {
        homeVal = false
      }
      this.setState({ history: tmp, path: path, area: area, level: level, searchState: searchState, home: homeVal }, function () {
        this.setTint();
        this.props.toggleSurveyNotification()
      })
    } else {
      if (level === 0) {
        homeVal = false
      }
      if (tmp.length > 0) {
        this.setState({ history: tmp, path: tmp[tmp.length - 1][0], area: area, level: level, searchState: searchState, home: homeVal }, function () {
          this.setTint();
          this.props.toggleSurveyNotification()
        })
      }
    }
  }
  render() {
    var animatedTint = this.state.tintAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [this.state.colorFrom, this.state.colorTo]
    });
    var offset = (this.state.scaling - 1) * 50
    var animatedCancelbtn = this.state.slideXAnim.interpolate({
      inputRange: [0, 100],
      outputRange: [0 - (52 + offset), (48 - offset)]
    });
    var animatedCancelbtnFade = this.state.slideXAnim.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1]
    });


    return (
      <View>
        <Animated.View style={[
          styles.search, {
            height: this.state.slideYAnim
          }
        ]}><View style={[styles.searchInputWrap, isTablet ? tabletStyles.searchInputWrap : null]}>
            <Animated.View style={[styles.searchInner,
            {
              right: this.state.slideXAnim
            }
            ]}>
              <TextInput autoCapitalize="none" autoComplete="off" returnKeyType="search" returnKeyLabel="search" style={styles.searchInput} placeholder="Search" placeholderTextColor="#768591" value={this.state.searchText} onSubmitEditing={a => this.submitSearch()} onFocus={a => this.showCancel()} onBlur={a => this.hideCancel()} onChangeText={(searchText) => this.setState({ searchText })} />
              <Image style={styles.searchIcon} source={require('./../images/small_search_icon.png')} />
              <FadeInOut visible={this.state.searchText.length > 0 ? true : false} style={styles.clearBtnWrap} duration={300}>
                <Pressable onPress={this.clearEvent} style={styles.clearBtn}><Image style={styles.btnImg} source={require('./../images/search_clear.png')} /></Pressable>
              </FadeInOut>
            </Animated.View>
            <Animated.View style={[styles.cancelBtnWrap,
            {
              right: animatedCancelbtn,
              opacity: animatedCancelbtnFade,

            }
            ]}>
              <Pressable onPress={this.cancelEvent} style={styles.cancelBtn}>
                <Text style={styles.cancelBtn} >Cancel</Text>
              </Pressable>
            </Animated.View>
          </View>
          <View style={styles.defaultBorder}></View>
          <Animated.View
            style={[
              styles.tintBorder,
              {
                backgroundColor: animatedTint,
                opacity: this.state.tintAnim
              }
            ]}
          ></Animated.View>
        </Animated.View>
        <View style={styles.header}>
          <FadeInOut style={styles.backBtn} visible={this.state.history.length > 1 ? true : false} duration={300}>
            <Pressable onPress={this.backEvent} ><Image style={styles.btnImg} source={require('./../images/back_arrow.png')} /></Pressable>
          </FadeInOut>
          <FadeInOut visible={this.state.home ? true : false} style={styles.homeBtnWrap} duration={300}>
            <Pressable onPress={this.homeEvent} style={[styles.homeBtn, { width: this.state.home ? 60 : 0 }]}><Image style={styles.btnImg} source={require('./../images/home_icon.png')} /></Pressable>
          </FadeInOut>
          <FadeInOut visible={this.state.level === 0 ? true : false} style={styles.moreBtnWrap} duration={300}>
            <Pressable onPress={this.moreEvent} style={[styles.moreBtn, { width: this.state.level >= 1 ? 0 : 60 }]}><Image style={styles.btnImg} source={require('./../images/more_icon.png')} /></Pressable>
          </FadeInOut>
          <Image style={styles.headerBranding} source={require('./../images/nhs_logo.png')} />
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  header: {
    position: "absolute",
    width: "100%",
    backgroundColor: '#FFFFFF',
    height: 48,
    alignItems: "center"
  },
  headerBranding: {
    height: 24.3,
    width: 61,
    top: 13

  },
  backBtn: {
    padding: 3,
    height: 54,
    width: 54,
    position: 'absolute',
    top: -2,
    left: 0
  },
  clearBtnWrap: {
    position: 'absolute',
    bottom: 12,
    right: 16
  },
  clearBtn: {
    height: 40,
    width: 40,
  },
  cancelBtnWrap: {
    position: 'absolute',
    bottom: 12,
    height: 40,
    justifyContent: 'center',
    textAlign: 'right'
  },
  cancelBtn: {
    color: '#005EB8',
    fontSize: 18,
    justifyContent: 'center',
    textAlign: 'right'
  },
  homeBtnWrap: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  homeBtn: {
    padding: 5,
    top: 0,
    height: 50,
    width: 50
  },
  moreBtnWrap: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  moreBtn: {
    padding: 5,
    top: 0,
    height: 50,
    width: 50
  },
  btnImg: {
    width: '100%',
    height: '100%'
  },
  search: {
    backgroundColor: '#FFFFFF',
    alignItems: "center",
    height: 114,
    justifyContent: "center",
    width: '100%',
  },
  searchInputWrap: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%'
  },
  searchInner: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0
  },
  searchInput: {
    position: 'absolute',
    bottom: 12,
    height: 40,
    left: 16,
    right: 16,
    backgroundColor: '#F1F4F5',
    borderRadius: 10,
    fontSize: 18,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 40,
    paddingRight: 40
  },
  searchIcon: {
    height: 40,
    width: 40,
    bottom: 12,
    left: 15,
    position: 'absolute'

  },
  defaultBorder: {
    height: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#CCC'
  },
  tintBorder: {
    height: 3.3,
    position: 'absolute',
    bottom: 0,
    opacity: 0,
    width: '100%',
    backgroundColor: '#FFF'
  }
});
const tabletStyles = StyleSheet.create({
  searchInputWrap: {
    width: 600,
    left: '50%',
    marginLeft: -300
  }
})

export default Navigation;