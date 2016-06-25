import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './main.html';

if (Meteor.user()) {
    Meteor.call('twitter.getCurrentUser', function(error, result) {
        Session.set('twitterUser', result);
    });
}

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
        let count = Session.get('notFollowingCount');
        if (count !== undefined) {
            return formatStat(Session.get('notFollowingCount'));
        }
    },
    numberOfFollowers() {
        let twitterUser = Session.get('twitterUser');
        if (twitterUser) {
            return formatStat(twitterUser.followers_count);
        }
    },
    numberFollowing() {
        let twitterUser = Session.get('twitterUser');
        if (twitterUser) {
            return formatStat(twitterUser.friends_count);
        }
    }
});

function formatStat(number) {
    if (number < 100000) {
        return number.toLocaleString('en-AU');
    } else if (number < 1000000) {
        return (number / 1000).toLocaleString('en-AU', { maximumSignificantDigits: 3 }) + 'k';
    } else {
        return (number / 1000000).toLocaleString('en-AU', { maximumSignificantDigits: 3 }) + 'm';
    }
}
