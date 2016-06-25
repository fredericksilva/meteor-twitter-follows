import { Meteor } from 'meteor/meteor';
import { Twitter } from './twitter';

var userTwitterConnections = {};

Meteor.startup(() => {
    // code to run on server at startup
});

/**
 * Helper function to do a Twitter API call synchronously using the current user's token
 */
function getTwitter() {
    if (!Meteor.user()) {
        return null;
    }
    let twitter = userTwitterConnections[Meteor.userId()];
    if (!twitter) {
        twitter = new Twitter(Meteor.user());
        // These connections will last forever.
        // TODO: move these connection to a session variable
        userTwitterConnections[Meteor.userId()] = twitter;
    }
    return twitter;
}

Meteor.methods({
    /**
     * Get current user's twitter profile details
     */
    'twitter.getCurrentUser'() {
        let Twitter = getTwitter();
        if (Twitter) {
            return Twitter.getProfile();
        }
    },

    /**
     * Get the details of the most resent followers of the current user
     */
    'twitter.getFollowers'(number = 5) {
        let Twitter = getTwitter();
        if (Twitter) {
            return Twitter.getFollowerProfiles(number);
        }
    },

    /**
     * Get the details of the most resent accounts the current user is following
     */
    'twitter.getFollowing'(number = 5) {
        let Twitter = getTwitter();
        if (Twitter) {
            return Twitter.getFollowingProfiles(number);
        }
    },

    /**
     * Get a count of how many accounts that the current user is following are following them back
     */
    'twitter.getNotFollowingCount'() {
        let Twitter = getTwitter();
        if (Twitter) {
            // Get all the IDs of users the current user is following
            let followingIds = Twitter.getFollowingIds();
            // Get all the IDs of users that are following the current user
            let followerIds = Twitter.getFollowerIds();

            // Get the intersection of all the users that are following the current user back
            let intersection = new Set([...followingIds].filter(id => followerIds.has(id)));

            // Return the difference between the number of users the current user is following and the number that are following them back
            return followingIds.size - intersection.size;
        }
    }
});
