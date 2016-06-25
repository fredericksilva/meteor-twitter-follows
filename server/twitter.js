import { TwitterAPI } from './twitter-api';

/**
 * Get details about a user from Twitter
 */
export class Twitter {
    constructor(user) {
        this.user = user;
        this.twitterAPI = new TwitterAPI(user);
    }

    /**
     * Get current user's twitter profile details
     */
    getProfile() {
        return this.twitterAPI.call('users/show', { user_id: this.user.services.twitter.id });
    }

    /**
     * Get the details of the most resent followers of the current user
     *
     * @param int number The maximum number of records to return. Cannot be greater than 20
     * @return array of user profiles that are following the user
     */
    getFollowerProfiles(number) {
        const followers = this.twitterAPI.call('followers/list', { count: number });
        return followers.users;
    }

    /**
     * Get the details of the most resent accounts the current user is following
     *
     * @param int number The maximum number of records to return. Cannot be greater than 20
     * @return array of user profiles that the user is following
     */
    getFollowingProfiles(number, checkFollowingBack = true) {
        // Get list of accounts the user is following
        const following = this.twitterAPI.call('friends/list', { count: number });
        if (!following) {
            return null;
        }
        let users = following.users;
        if (checkFollowingBack) {
            // Get the connections between those users and the current user
            const screenNames = following.users.map(user => user.screen_name);
            const connections = this.twitterAPI.call('friendships/lookup', { screen_name: screenNames.join(',') });
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

            // Check each connection if the other account is following the user back
            for (const [i, connection] of connections.entries()) {
                for (const connectionType of connection.connections) {
                    if (connectionType == 'followed_by') {
                        // connections are returned in the same order they were requested in so the connections index should be the same as the users index
                        users[i].followed_by = true;
                    }
                }
            }
        }
        return users;
    }

    /**
     * Get all the IDs of users the current user is following
     */
    getFollowingIds() {
        let cursor = -1;
        let followingIds = new Set();
        do {
            const result = this.twitterAPI.call('friends/ids', {
                user_id: this.user.services.twitter.id,
                count: 5000,
                cursor: cursor
            });
            followingIds = new Set([...followingIds, ...result.ids])
            cursor = result.next_cursor;
        } while (cursor > 0);
        return followingIds;
    }

    /**
     * Get all the IDs of users that are following the current user
     */
    getFollowerIds() {
        cursor = -1;
        let followerIds = new Set();
        do {
            const result = this.twitterAPI.call('followers/ids', {
                user_id: this.user.services.twitter.id,
                count: 5000,
                cursor: cursor
            });
            followerIds = new Set([...followerIds, ...result.ids])
            cursor = result.next_cursor;
        } while (cursor > 0);
        return followerIds;
    }
}
