import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

var Twit;
var Future;

Meteor.startup(() => {
    // code to run on server at startup

    Twit = Meteor.npmRequire('twit');
    Future = Npm.require('fibers/future');
});

/**
 * Helper function to do a Twitter API call synchronously using the current user's token
 */
function twitter(api, parameters) {
    if (!Meteor.user()) {
        return null;
    }
    var T = new Twit({
        consumer_key: Meteor.settings.twitter.api.key,
        consumer_secret: Meteor.settings.twitter.api.secret,
        access_token: Meteor.user().services.twitter.accessToken,
        access_token_secret: Meteor.user().services.twitter.accessTokenSecret
    });
    var future = new Future();
    T.get(api, parameters, function(error, data, response) {
        if (error) {
            future.throw(error);
        } else {
            future.return(data);
        }
    });
    return future.wait();
}

Meteor.methods({
    getUser: function() {
        return Meteor.user();
    },
    getTwitterUser: function() {
        if (!Meteor.user()) {
            return null;
        }
        return twitter('users/show', { user_id: Meteor.user().services.twitter.id });
    },
    getFollowers: function(number = 5) {
        const followers = twitter('followers/list', { count: number });
        return followers.users;
    },
    getFollowing: function(number = 5) {
        // Get list of accounts the user is following
        const following = twitter('friends/list', { count: number });
        if (!following) {
            return null;
        }
        // Get the connections between those users and the current user
        const screenNames = following.users.map(user => user.screen_name);
        const connections = twitter('friendships/lookup', { screen_name: screenNames.join(',') });
        /**
         * Connections look like
         * [
         *  {
         *      id: 67995848,
         *      connections: [ 'following' ]
         *  },
         *  {
         *      id: 68412310,
         *      connections: [ 'following', 'followed_by' ]
         *  }
         * ]
         */

        let users = following.users;

        // Check each connection if the other account is following the user back
        for (const [i, connection] of connections.entries()) {
            for (const connectionType of connection.connections) {
                if (connectionType == 'followed_by') {
                    // connections are returned in the same order they were requested in so the connections index should be the same as the users index
                    users[i].followed_by = true;
                }
            }
        }
        return users;
    }
});
