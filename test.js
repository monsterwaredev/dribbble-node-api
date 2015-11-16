
var DribbbleAPI = require('./index.js');

(function() {

    var dribbble = new DribbbleAPI();

    dribbble.set('access_token', 'ddd74328bb9bbf4645a5ced13514e3fefd6e7fafc1b8b0a9d3b8f27581ac7ce3');

    dribbble.shots(function(err, res) {
        this.log(res);
    });

}).call(this);

