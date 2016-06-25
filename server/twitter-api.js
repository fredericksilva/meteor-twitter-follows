import { Meteor } from 'meteor/meteor';

const RATE_LIMIT_STATUS_CODE = 429;

/**
 * Connect to the Twitter API using a user's credentials
 *
 * This call can be used to either call the Twitter API asynchronously and run
 * the result in a callback function, or synchronously and return the result to
 * the calling function.
 */
export class TwitterAPI {
    constructor(user) {
        if (!user || !user.services.twitter.accessToken) {
            throw('User must be signed in with Twitter');
        }
        this.Twit = Meteor.npmRequire('twit');
        this.Future = Npm.require('fibers/future');

        this.user = user;
        this.T = new this.Twit({
            consumer_key: Meteor.settings.twitter.api.key,
            consumer_secret: Meteor.settings.twitter.api.secret,
            access_token: user.services.twitter.accessToken,
            access_token_secret: user.services.twitter.accessTokenSecret
        });
    }

    /**
     * Do an asynchronous call to the Twitter API.
     * The callback function should take the parameters (error, data, response)
     */
    asyncCall(endpoint, options, callback) {
        this.T.get(endpoint, options, callback);
    }

    /**
     * Do a synchronous call to the Twitter API.
     * This will block the calling function until a response has been received
     * from twitter and will return the response to the calling function.
     */
    call(endpoint, options) {
        let future = new this.Future();
        this.T.get(endpoint, options, function(error, data, response) {
            if (error) {
                if (error.statusCode == this.RATE_LIMIT_STATUS_CODE) {
                    //TODO: show appropriate error when we hit the API rate limit
                }
                future.throw(error);
            } else {
                future.return(data);
            }
        });
        return future.wait();
    }
}
