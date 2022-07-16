<template>
    <div>
        <!-- <button @click="updateMarketData">Update market data</button> -->
        <!-- Item ID: <input type="text" v-model="itemID"/> -->
        <br>
        World to compare: 
        <select v-model="selectedWorld">
            <option :value="'Leviathan'">Leviathan</option>
            <option :value="'Famfrit'">Famfrit</option>
            <option :value="'Hyperion'">Hyperion</option>
            <option :value="'Ultros'">Ultros</option>
            <option :value="'Excalibur'">Excalibur</option>
            <option :value="'Behemoth'">Behemoth</option>
            <option :value="'Lamia'">Lamia</option>
            <option :value="'Exodus'">Exodus</option>
            <option :value="'Faerie'">Faerie</option>
            <option :value="'Siren'">Siren</option>
            <option :value="'Gilgamesh'">Gilgamesh</option>
            <option :value="'Cactuar'">Cactuar</option>
            <option :value="'Jenova'">Jenova</option>
            <option :value="'Adamantoise'">Adamantoise</option>
            <option :value="'Sargatanas'">Sargatanas</option>
            <option :value="'Midgardsormr'">Midgardsormr</option>
            <option :value="'Zalera'">Zalera</option>
            <option :value="'Malboro'">Malboro</option>
            <option :value="'Goblin'">Goblin</option>
            <option :value="'Coeurl'">Coeurl</option>
            <option :value="'Brynhildr'">Brynhildr</option>
            <option :value="'Diabolos'">Diabolos</option>
            <option :value="'Balmung'">Balmung</option>
            <option :value="'Mateus'">Mateus</option>
        </select>
        <br>
        <button @click="test">Go</button>
        <div>{{ datadump }}</div>

        <table class="table table-bordered">
            <tr>
                <th>Item Name</th>
                <th>Purchase Price (Lowest World Median Sales)</th>
                <th>World</th>
                <th>Sale Price (Home World Median Sales)</th>
                <th>Difference</th>
                <th>Number of sales (Home world)</th>
            </tr>
            <tr v-for="item of medianSaleData">
                <td>{{item.itemID}}</td>
                <td>{{item.medianPrice}}</td>
                <td>{{item.worldName}}</td>
                <td>{{item.selectedWorldMedian}}</td>
                <td>{{item.difference}}</td>
                <td>{{item.saleCount}}</td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    data() {
        return{
            medianSaleData: null,
            datadump: null,
            selectedWorld: "Excalibur",
            selectedWorldPrice: null
        }
    },
    async mounted() {
        // await this.getMedianSoldPrice();
    },
    methods: {
        async test() {
            if (!this.selectedWorld) return;
            const data = await this.$axios.$get(`http://localhost:4000/api/getMedianSoldPrice/allItems/${this.selectedWorld}`);
            this.medianSaleData = data;
        },
    },
    name: 'IndexPage'
}
</script>
