import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

var Twit;
var Future;
var userTwitterConnections = {};

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
    var T = userTwitterConnections[Meteor.userId()];
    if (!T) {
        var T = new Twit({
            consumer_key: Meteor.settings.twitter.api.key,
            consumer_secret: Meteor.settings.twitter.api.secret,
            access_token: Meteor.user().services.twitter.accessToken,
            access_token_secret: Meteor.user().services.twitter.accessTokenSecret
        });
        // These connections will last forever.
        // TODO: move these connection to a session variable
        userTwitterConnections[Meteor.userId()] = T;
    }
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
    /**
     * Get current user's twitter profile details
     */
    'twitter.getCurrentUser'() {
        if (!Meteor.user()) {
            return null;
        }
        return twitter('users/show', { user_id: Meteor.user().services.twitter.id });
    },

    /**
     * Get the details of the most resent followers of the current user
     */
    'twitter.getFollowers'(number = 5) {
        const followers = twitter('followers/list', { count: number });
        return followers.users;
    },

    /**
     * Get the details of the most resent accounts the current user is following
     */
    'twitter.getFollowing'(number = 5) {
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
    },

    /**
     * Get a count of how many accounts that the current user is following are following them back
     */
    'twitter.getNotFollowingCount'() {
        // Get all the IDs of users the current user is following
        let cursor = -1;
        let followingIds = new Set();
        do {
            const result = twitter('friends/ids', {
                user_id: Meteor.user().services.twitter.id,
                count: 5000,
                cursor: cursor
            });
            followingIds = new Set([...followingIds, ...result.ids])
            cursor = result.next_cursor;
        } while (cursor > 0);

        // Get all the IDs of users that are following the current user
        cursor = -1;
        let followerIds = new Set();
        do {
            const result = twitter('followers/ids', {
                user_id: Meteor.user().services.twitter.id,
                count: 5000,
                cursor: cursor
            });
            followerIds = new Set([...followerIds, ...result.ids])
            cursor = result.next_cursor;
        } while (cursor > 0);

        // Get the intersection of all the users that are following the current user back
        let intersection = new Set([...followingIds].filter(id => followerIds.has(id)));

        // Return the difference between the number of users the current user is following and the number that are following them back
        return followingIds.size - intersection.size;
    }
});
