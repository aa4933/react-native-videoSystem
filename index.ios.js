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
} from 'react-native';

import List from './app/list/index';
import My from './app/my/index';
import Login from './app/my/login';
import More from './app/more/index';


export default class VideoApp extends Component {

    //第一次默认选择
    constructor(props) {
        super(props);
        this.state = {
            selectedTab: 'More',
            logined: false,
            user: null,
        };
    };

    componentDidMount() {
        //this._testClear();
        this._asyncAppStatus();
    };

    _asyncAppStatus() {
        AsyncStorage.getItem('user')
            .then((data)=> {
                var user;
                var userState = {};
                if (data) {
                    user = JSON.parse(data);
                }
                if (user && user.accessToken) {
                    userState.user = user;
                    userState.logined = true;
                } else {
                    userState.logined = false;
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

//总图
    render() {
        var that=this;
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
});
AppRegistry.registerComponent('videoApp', () => VideoApp);
