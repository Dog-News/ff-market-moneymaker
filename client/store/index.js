export const state = () => ({
    selectedDataCenter: 'Primal' // Default value
});

export const mutations = {
    setSelectedDataCenter(state, dataCenter) {
        state.selectedDataCenter = dataCenter;
    }
};

export const actions = {
    updateSelectedDataCenter({ commit }, dataCenter) {
        commit('setSelectedDataCenter', dataCenter);
    }
};