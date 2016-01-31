var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
	consumerKey: 'DpNomjnbBbuPQqRlXfqdejOCT',
	consumerSecret: '	7bNG7inq6orHIm4Jty8XLCkVjnmRx23V4zhyUkUTC7YTp59vOX',
	callback: 'http://urbica.co'
});


twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
	if (error) {
		console.log("Error getting OAuth request token : " + JSON.stringify(error));
	} else {
		//store token and tokenSecret somewhere, you'll need them later; redirect user
	}
});
