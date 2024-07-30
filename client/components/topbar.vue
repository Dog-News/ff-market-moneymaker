<template>
    <div id="topbar">
        <!-- <button @click="updateMarketData">Update market data</button> -->
        <!-- Item ID: <input type="text" v-model="itemID"/> -->
        <nav class="navbar navbar-expand-lg px-5 py-4">
        <div class="d-flex w-100 justify-content-end">
        <div class="d-flex">
                <select class="custom-select" @change="handleChange" v-model="selectedDataCenter">
                    <option value="Aether">Aether</option>
                    <option value="Primal">Primal</option>
                    <option value="Crystal">Crystal</option>
                    <option value="Dynamis">Dynamis</option>
                </select>
        
                <!-- <button class="btn btn-primary ml-2" @click="test">Go</button>
                <div>{{ datadump }}</div> -->
            </div>
        </div>
        </nav>
    </div>
</template>

<script>
export default {
    data() {
        return {
            selectedDataCenter: this.$store.state.selectedDataCenter || 'Primal', // Default to Primal if not in store
        };
    },
    methods: {
        handleChange() {
            // Commit the change to Vuex
            this.$store.dispatch('updateSelectedDataCenter', this.selectedDataCenter);
        }
    },
    mounted() {
        // Set the selectedDataCenter from the Vuex store when the component is mounted
        this.selectedDataCenter = this.$store.state.selectedDataCenter || 'Primal'; 
    }
}
</script>