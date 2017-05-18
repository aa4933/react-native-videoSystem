/**
 * Created by wuilly on 2017/4/19.
 */

'use strict';

import React, {Component}  from  'react';
import Button from 'react-native-button';
import Swiper from 'react-native-swiper';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Image,
    Dimensions,
} from 'react-native';


var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;
export default React.createClass({
    getInitialState(){
        return ({
            loop: false,
            imageURL: [
                require('../assets/images/s2.jpeg'),
                require('../assets/images/s1.jpeg'),
                require('../assets/images/s3.jpeg')
            ]
        });
    },
    _enter(){
        this.props.enterSlide();
    },
    render() {
        return (
            <Swiper style={styles.container}
                    dot={<View style={styles.dot} />}
                    activeDot={<View style={styles.activeDot} />}
                    paginationStyle={styles.pagination}
                    loop={this.state.loop}
            >
                <View style={styles.slide} >
                    <Image   style={styles.image} source={this.state.imageURL[0]} />
                </View>
                <View style={styles.slide} >
                    <Image  style={styles.image} source={this.state.imageURL[2]} />
                </View>
                <View style={styles.slide} >
                    <Image style={styles.image} source={this.state.imageURL[1]} />
                    <Button
                        style={styles.btn}
                        onPress={this._enter}>进入兰鸟</Button>
                </View>
            </Swiper>
        )
    }
});


const styles = StyleSheet.create({
    container: {
    },
    btn: {
        backgroundColor: 'rgba(8,8,8,0.4)',
        borderColor: 'rgba(8,8,8,0.4)',
        borderWidth: 1,
        borderRadius: 3,
        color: '#fff',
        position: 'absolute',
        width: width - 20,
        left: 10,
        bottom: 60,
        height: 50,
        padding: 15,
        fontSize: 18,
        fontWeight:'300',
    },
    dot: {
        backgroundColor: 'transparent',
        borderColor: '#ff6600',
        borderWidth: 1,
        borderRadius: 7,
        marginLeft: 12,
        marginRight: 12,
        width: 14,
        height: 14,
    },
    activeDot: {
        width: 14,
        borderRadius: 7,
        height: 14,
        borderColor: '#ccc',
        borderWidth: 1,
        marginLeft: 12,
        marginRight: 12,
        backgroundColor: '#ee735c'
    },
    pagination: {
        bottom: 30,
    },
    image: {
        flex: 1,
        width: width,
    },
    slide: {
        width: width,
        flex: 1,
    },
});