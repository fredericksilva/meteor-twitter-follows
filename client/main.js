import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './main.html';

Meteor.call('getTwitterUser', function(error, result) {
    console.log(result);
    Session.set('twitterUser', result);
});

Template.followers.onCreated(function followersOnCreated() {
    if (!Session.get('followers')) {
        Meteor.call('getFollowers', 20, function(error, result) {
            Session.set('followers', result);
        });
    }
});

Template.following.onCreated(function followingOnCreated() {
    if (!Session.get('following')) {
        Meteor.call('getFollowing', 20, function(error, result) {
            Session.set('following', result);
        });
    }
});

Template.followers.helpers({
    followers() {
        return Session.get('followers');
    },
    numberOfFollowers() {
        const TwitterUser = Session.get('twitterUser');
        if (TwitterUser) {
            return TwitterUser.followers_count;
        }
    }
});

Template.following.helpers({
    following() {
        return Session.get('following');
    },
    numberFollowing() {
        const TwitterUser = Session.get('twitterUser');
        if (TwitterUser) {
            return TwitterUser.friends_count;
        }
    }
});
