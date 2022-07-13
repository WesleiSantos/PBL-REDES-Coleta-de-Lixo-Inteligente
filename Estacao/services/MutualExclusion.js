const { send } = require('process');
const {
    promisify
} = require('util');

class MutualExclusion {
    constructor(mqtt_client, topic, region) {
        this.mqtt_client = mqtt_client;
        this.topic = topic;
        this.region = region;
        this.current_time = 0;
        this.my_timestamp = 0;
        this.replies_pending=3;
        this.is_requesting=false;
        this.reply_deferred = [];
        this.totalProccess = 3;
        this.list_trash = []
    }

    enter_cs(trash){
        console.log("ENTER_CS");
        this.list_trash = trash;
        this.my_timestamp = this.current_time;
        this.is_requesting = true;
        this.replies_pending = 3;
        this.mqtt_client.publish(this.topic, JSON.stringify({type:'REQ', id:this.region, list_trash: trash ,timestamp: this.my_timestamp}));
    }

    exit_CS(){
        this.is_requesting = false;
    }

    setCurrentTime(time){
        if(this.current_time < time){
            this.current_time = time + 1;
        }
        return this.current_time;
    }

    getTimestamp(){
        return this.my_timestamp;
    }

    getIsRequesting(){
        return this.is_requesting;
    }

    setReplyPending(){
        this.replies_pending = this.replies_pending-1;
    }
    getReplyPending(){
        return this.replies_pending;
    }
}

module.exports = MutualExclusion;