/**
 * Created by wuilly on 2017/3/24.
 */

'use strict';
import React, {Component} from 'react';
import request from '../common/request';
import config from '../common/config';
import Detail from './detail';
import {
    StyleSheet,
    Text,
    ActivityIndicator,
    View,
    ListView,
    Image,
    Dimensions,
    TouchableHighlight,
    RefreshControl,
    AsyncStorage,
    Alert,
} from 'react-native';

var width = Dimensions.get('window').width;
var cacheResults = {
    nextPage: 1,
    items: [],
    total: 0,
}

var Item = React.createClass({
    getInitialState(){
        var row = this.props.row;
        var user = this.props.user || {};
        return {
            user: user,
            up: row.voted,
            row: row
        }
    },
    componentDidMount(){
        this._getAsyncStorage();
    },
    _getAsyncStorage(){
        AsyncStorage.getItem('user')
            .then((data)=> {
                var user;
                if (data) {
                    user = JSON.parse(data);
                }

                if (user && user.accessToken) {
                    console.log(user.accessToken)
                    this.setState({
                        user: user,
                    })
                }
            })
    },
    _up(){
        var that = this;
        var row = this.state.row;
        var up = !this.state.up;
        var url = config.api.base + config.api.up;

        var body = {
            id: row._id,
            up: up ? true : false,
            accessToken: this.state.user.accessToken,
        }
        request.post(url, body)
            .then(function (data) {
                if (data && data.success) {
                    that.setState({
                        up: up
                    })
                } else {
                    console.log(data)
                    Alert.alert("点赞失败，请稍后重试");
                }
            })
            .catch(function (err) {
                console.log(err);
                Alert.alert("点赞失败，请稍后重试");
            })
    },
    render(){
        var row = this.state.row;
        return (
            <TouchableHighlight onPress={this.props.onSelect}>
                <View style={styles.item}>
                    <Text style={styles.title}>{row.title}</Text>
                    <Image
                        source={{uri: config.qiniu.show+row.qiniu_thumb}}
                        style={styles.thumb}
                    >
                        {/*<Icon
                         name='ios-play'
                         size={28}
                         style={styles.play}
                         />*/}
                        <Text style={[{fontFamily: 'iconfont', fontSize: 28}, styles.play]}>&#xe622;</Text>
                    </Image>
                    <View style={styles.itemFooter}>
                        <View style={styles.handleBox}>
                            <Text style={[
                                {fontFamily: 'iconfont', fontSize: 28},
                                this.state.up ? styles.down : styles.up
                            ]}
                                  onPress={this._up}
                            >&#xe601;</Text>
                            <Text style={styles.handleText} onPress={this._up}>喜欢</Text>
                        </View>
                        <View style={styles.handleBox}>
                            <Text style={[{fontFamily: 'iconfont', fontSize: 28}, styles.up]}>&#xe612;</Text>
                            <Text style={styles.handleText}>评论</Text>
                        </View>
                    </View>
                </View>
            </TouchableHighlight>
        )
    }

});
export default React.createClass({
    getInitialState () {
        var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        return {
            user: {},
            isRefreshing: false,
            isLoadingTail: false,
            dataSource: ds.cloneWithRows([]),
        };
    },
    _getAsyncStorage(){
        AsyncStorage.getItem('user')
            .then((data)=> {
                var user;
                if (data) {
                    user = JSON.parse(data);
                }
                if (user && user.accessToken) {
                    console.log(user.accessToken)
                    this.setState({
                        user: user
                    })
                    //确定拿到token以后才能fetch
                    this._fetchData(1);
                }
            })
            .catch((err)=> {
                console.log(err);
            })
    },
    _renderRow (row) {
        return (<Item
            key={row._id}
            onSelect={()=>this._loadPage(row)}
            row={row}
        />)
    },
    componentDidMount(){
        //此处获取有一点不一样，由于获取已经是异步，所以我们必须获取完毕才能执行fetch，否则无法拿到token
        this._getAsyncStorage()
    },
    _fetchData(page){
        var that = this

        if (page !== 0) {
            this.setState({
                isLoadingTail: true,
            });
        } else {
            this.setState({
                isRefreshing: true
            });
        }

        request.get(config.api.base + config.api.creations, {
            accessToken: this.state.user.accessToken,
            page: page
        })
            .then((data) => {
                if (data.success) {

                    var items = cacheResults.items.slice();
                    if (page !== 0) {
                        items = items.concat(data.data);
                        cacheResults.nextPage += 1;
                    } else {
                        items = data.data.concat(items);
                    }

                    cacheResults.items = items;
                    cacheResults.total = data.total;

                    if (page !== 0) {
                        that.setState({
                            isLoadingTail: false,
                            dataSource: that.state.dataSource.cloneWithRows(
                                cacheResults.items)
                        });
                    } else {
                        that.setState({
                            isRefreshing: false,
                            dataSource: that.state.dataSource.cloneWithRows(
                                cacheResults.items)
                        });
                    }
                }
            })
            .catch((error) => {
                if (page !== 0) {
                    that.setState({
                        isLoadingTail: false,
                    });
                } else {
                    that.setState({
                        isRefreshing: false,
                    });
                }
                console.error(error);
            });
    },
    _renderFooter(){
        if (!this._hasMore() && cacheResults.total !== 0) {
            return (
                <View style={styles.loadingMore}>
                    <Text style={styles.loadingText}>没有更多了</Text>
                </View>
            );
        }

        if (!this.state.isLoadingTail) {
            return (<View style={styles.loadingMore}/>);
        }


        return (<ActivityIndicator style={styles.loadingMore}/>)

    },
    _hasMore(){
        return cacheResults.items.length !== cacheResults.total
    },
    _onRefresh(){
        if (!this._hasMore() || this.state.isRefreshing) {
            return
        }
        this._fetchData(0);
    },
    _fetchMoreData (){
        if (!this._hasMore() || this.state.isLoadingTail) {
            return
        }

        var page = cacheResults.nextPage;
        this._fetchData(page);
    },
    _loadPage(row){
        this.props.navigator.push({
            name: 'detail',
            component: Detail,
            params: {
                data: row,
                user: this.state.user,
            }
        })
    },
    render() {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>视频列表</Text>
                </View>
                <ListView
                    dataSource={this.state.dataSource}
                    renderRow={this._renderRow}
                    renderFooter={this._renderFooter}
                    onEndReached={this._fetchMoreData}
                    onEndReachedThreshold={20}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={this._onRefresh}
                            tintColor="#ff6600"
                            title="拼命加载中..."
                        />
                    }
                    enableEmptySections={true}
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustContentInsets={false}
                />
            </View>
        )
    }
});


const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    header: {
        paddingTop: 25,
        paddingBottom: 12,
        backgroundColor: '#ee735c'
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    item: {
        width: width,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    thumb: {
        width: width,
        height: width * 0.56,
        resizeMode: 'cover',
    },
    title: {
        padding: 10,
        fontSize: 18,
        color: '#333',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#eee',
    },
    handleBox: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        width: width / 2 - 0.5,
        backgroundColor: '#fff',
    },
    play: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        width: 46,
        height: 46,
        paddingTop: 9,
        paddingLeft: 13,
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 23,
        color: '#ed7b66',
    },
    handleText: {
        paddingLeft: 12,
        fontSize: 18,
        color: '#333',
    },
    up: {
        fontSize: 22,
        color: '#333',
    },
    down: {
        fontSize: 22,
        color: '#ed7b66',
    },
    commentIcon: {
        fontSize: 22,
        color: '#333',
    },
    loadingMore: {
        marginVertical: 20
    },
    loadingText: {
        color: '#777',
        textAlign: 'center',
    }
});
