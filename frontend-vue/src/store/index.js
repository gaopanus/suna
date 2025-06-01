import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

// Example of a store definition (can be in a separate file like src/store/user.js)
// import { defineStore } from 'pinia';
// export const useUserStore = defineStore('user', {
//   state: () => ({
//     isLoggedIn: false,
//     userData: null,
//   }),
//   actions: {
//     login(user) {
//       this.isLoggedIn = true;
//       this.userData = user;
//     },
//     logout() {
//       this.isLoggedIn = false;
//       this.userData = null;
//     },
//   },
//   getters: {
//     userName: (state) => state.userData?.name || 'Guest',
//   }
// });
