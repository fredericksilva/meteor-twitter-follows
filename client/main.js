import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './main.html';

Meteor.call('twitter.getCurrentUser', function(error, result) {
    Session.set('twitterUser', result);
});

Template.followers.onCreated(function followersOnCreated() {
    if (!Session.get('followers')) {
        Meteor.call('twitter.getFollowers', 20, function(error, result) {
            Session.set('followers', result);
        });
    }
});

Template.following.onCreated(function followingOnCreated() {
    if (!Session.get('following')) {
        Meteor.call('twitter.getFollowing', 20, function(error, result) {
            Session.set('following', result);
        });
    }
});

Template.stats.onCreated(function statsOnCreated() {
    if (!Session.get('notFollowingCount')) {
        Meteor.call('twitter.getNotFollowingCount', function(error, result) {
            Session.set('notFollowingCount', result);
        });
    }
});

Template.followers.helpers({
    followers() {
        return Session.get('followers');
    }
});

Template.following.helpers({
    following() {
        return Session.get('following');
    }
});

Template.stats.helpers({
    notFollowingCount() {
        return Session.get('notFollowingCount');
    },
    numberOfFollowers() {
        const TwitterUser = Session.get('twitterUser');
        if (TwitterUser) {
            return TwitterUser.followers_count;
        }
    },
    numberFollowing() {
        const TwitterUser = Session.get('twitterUser');
        if (TwitterUser) {
            return TwitterUser.friends_count;
        }
    }
});
