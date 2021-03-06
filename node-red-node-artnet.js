module.exports = function(RED) {
    var artnet = require('artnet-node');

    function ArtnetNodeOutput(config) {
        RED.nodes.createNode(this, config);

        this.address = config.address;
        this.port = config.port || 6454;
        this.rate = config.rate || 40;
        this.size = config.size || 512;
        this.interval = 1000.0 / config.rate;

        this.client = artnet.Client.createClient(this.address, this.port);
        this.data = [];
        this.set = function(address, value) {
            this.data[address] = value;
        };

        var node = this;

        this.on('input', function(msg) {
            var payload = msg.payload;
            if(Array.isArray(payload.data)) {
                payload.offset = payload.offset || 0;
                for(var i = payload.offset; i < payload.offset + payload.data.length; i++) {
                    node.data[i] = payload.data[i];
                }
            } else if(payload.address) {
                node.set(payload.address, payload.value);
            } else if(Array.isArray(payload.buckets)) {
                for(var i = 0; i < payload.buckets.length; i++) {
                    node.set(payload.buckets[i].address, payload.buckets[i].value);
                }
            }
        });
        this.on('close', function(done) {
            if(node.timer) {
                clearInterval(node.timer);
                node.timer = null;
            }
        });

        this.timer = setInterval(function() {
            node.client.send(node.data);
        }, this.interval);
    }
    RED.nodes.registerType("artnet out", ArtnetNodeOutput);
}