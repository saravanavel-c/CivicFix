import { getFromStorage, saveToStorage } from './storage';

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const nearbyService = {
  async getNearbyIssues() {
    await delay();
    return getFromStorage('NEARBY');
  },

  async upvoteIssue(id) {
    await delay(200);
    const nearby = getFromStorage('NEARBY');
    const index = nearby.findIndex(item => item.id === id);
    if (index !== -1) {
      const issue = nearby[index];
      if (issue.userUpvoted) {
        issue.upvotes -= 1;
        issue.userUpvoted = false;
      } else {
        issue.upvotes += 1;
        issue.userUpvoted = true;
      }
      saveToStorage('NEARBY', nearby);
      return issue;
    }
    throw new Error('Nearby issue not found');
  }
};
