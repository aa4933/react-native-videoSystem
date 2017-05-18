/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
    Text,
    StyleSheet,
    TabBarIOS,
    AppRegistry,
    Navigator,
    AsyncStorage,
    ActivityIndicator,
    Dimensions,
    View,
} from 'react-native';

import List from './app/list/index';
import My from './app/my/index';
import Login from './app/my/login';
import Slider from './app/my/carousel';
import More from './app/more/index';


var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;

export default class VideoApp extends Component {

    //第一次默认选择
    constructor(props) {
        super(props);
        this.state = {
            selectedTab: 'More',
            logined: false,
            user: null,
            booted: false,
            entered:false,
        };
    };

    componentDidMount() {
        //this._testClear();
        this._asyncAppStatus();
    };

    _asyncAppStatus() {
        AsyncStorage.multiGet(['user','entered'])
            .then((data)=> {
                var userData=data[0][1]
                var entered=data[1][1]
                var user;
                var userState = {
                    booted: true
                };
                if (userData) {
                    user = JSON.parse(userData);
                }
                if (user && user.accessToken) {
                    userState.user = user;
                    userState.logined = true;
                } else {
                    userState.logined = false;
                }

                if (entered==='yes'){
                    userState.entered=true
                }

                this.setState(userState);
            })
    };

    _afterLogin(user) {
        user = JSON.stringify(user);
        AsyncStorage.setItem('user', user)
            .then(()=> {
                this.setState({
                    logined: true,
                    user: user,
                });
            })

    };

    _testClear() {
        console.log(this);
        AsyncStorage.clear();
    };

    _logout() {

        AsyncStorage.removeItem('user');
        this.setState({
            user: null,
            logined: false,
        });
    };
    _enterSlide(){
        this.setState({
            entered:true
        },()=>{
            AsyncStorage.setItem('entered','yes');
        })
    };
//总图
    render() {
        var that = this;

        if (!this.state.booted) {
            return (
                <View style={styles.bootPage}>
                    <ActivityIndicator color="#ee735c"/>
                </View>
            )
        }
        if (!this.state.entered){
            return (
                <Slider enterSlide = {this._enterSlide.bind(that)}/>
            )
        }
        if (!this.state.logined) {
            return (<Login afterLogin={that._afterLogin.bind(that)}/>);
        }
        return (
            <TabBarIOS tintColor="#ee735c">
                <TabBarIOS.Item
                    systemIcon="featured"
                    selected={this.state.selectedTab === 'List'}
                    onPress={() => {
                        this.setState({
                            selectedTab: 'List',
                        });
                    }}
                >
                    <Navigator
                        initialRoute={{
                            name: 'list',
                            component: List
                        }}
                        configureScene={(route)=> {
                            return Navigator.SceneConfigs.FloatFromRight
                        }}
                        renderScene={(route, navigator)=> {
                            var Component = route.component;
                            return <Component
                                {...route.params}
                                navigator={navigator}
                            />

                        }}
                    />
                </TabBarIOS.Item>
                <TabBarIOS.Item
                    systemIcon="contacts"
                    selected={this.state.selectedTab === 'My'}
                    onPress={() => {
                        this.setState({
                            selectedTab: 'My',
                        });
                    }}
                >
                    <My user={this.state.user} logout={this._logout.bind(this)}/>
                </TabBarIOS.Item>
                <TabBarIOS.Item
                    systemIcon="more"
                    selected={this.state.selectedTab === 'More'}
                    onPress={() => {
                        this.setState({
                            selectedTab: 'More',
                        });
                    }}
                >
                    <More />
                </TabBarIOS.Item>
            </TabBarIOS>
        );
    };

}

const styles = StyleSheet.create({
    button: {
        height: 40,
        width: 150,
        borderRadius: 20,
        backgroundColor: 'green',
        justifyContent: 'center',
        overflow: 'hidden',

    },
    buttonText: {
        textAlign: 'center',
        color: 'white',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
    bootPage: {
        width: width,
        height: height,
        backgroundColor:'#fff',
        justifyContent:'center',
    },
});
AppRegistry.registerComponent('videoApp', () => VideoApp);
