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
        this.is_region_critical=false;
    }

    enter_cs(trash){
        console.log("ENTER_CS");
        this.list_trash = trash;
        this.is_region_critical=false;
        //this.current_time = 0;
        this.my_timestamp = this.current_time;
        //this.is_requesting = true;
        this.replies_pending = 3;
        this.mqtt_client.publish(this.topic, JSON.stringify({type:'REQ', id:this.region, list_trash: trash ,timestamp: this.my_timestamp}));
    }
    reset(){
        this.list_trash=[]
        this.is_region_critical=false;
        this.current_time = 0;
        this.my_timestamp=0;
        this.replies_pending = 3;
    }

    exit_CS(){
        this.is_requesting = false;
    }

    setRegionCritical(val){
        this.is_region_critical = val;
    }

    getRegionCritical(){
        return this.is_region_critical;
    }

    setCurrentTime(time){
        if(this.current_time < time){
            this.current_time = time + 1;
        }else{
            this.current_time = this.current_time + 1;
        }
        return this.current_time;
    }

    getTimestamp(){
        return this.my_timestamp;
    }

    getCurrentTime(){
        return this.current_time;
    }

    getIsRequesting(){
        return this.is_requesting;
    }

    setReplyPending(num){
        this.replies_pending = this.replies_pending+num;
    }
    getReplyPending(){
        return this.replies_pending;
    }

    getListTrash(){
        return this.list_trash;
    }

    setFalseRequesting(){
        this.is_requesting = false;
    }

    setTrueRequesting(){
        this.is_requesting = true;
    }
}

module.exports = MutualExclusion;