import { getFromStorage, saveToStorage } from './storage';

const delay = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  async getUserProfile() {
    await delay();
    return getFromStorage('USER');
  },

  async updateUserProfile(profileData) {
    await delay(600);
    const user = getFromStorage('USER');
    const updatedUser = {
      ...user,
      ...profileData
    };
    saveToStorage('USER', updatedUser);
    return updatedUser;
  }
};
