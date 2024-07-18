<template>
    <div>
        <!-- <button @click="updateMarketData">Update market data</button> -->
        Item ID: <input type="text" v-model="itemID"/>
        <br>
        World to compare: 
        <select v-model="selectedWorld">
            <option :value="64">Leviathan</option>
            <option :value="35">Famfrit</option>
            <option :value="95">Hyperion</option>
            <option :value="77">Ultros</option>
            <option :value="93">Excalibur</option>
            <option :value="78">Behemoth</option>
            <option :value="55">Lamia</option>
            <option :value="53">Exodus</option>
            <option :value="54">Faerie</option>
            <option :value="57">Siren</option>
            <option :value="63">Gilgamesh</option>
            <option :value="79">Cactuar</option>
            <option :value="40">Jenova</option>
            <option :value="73">Adamantoise</option>
            <option :value="99">Sargatanas</option>
            <option :value="65">Midgardsormr</option>
            <option :value="41">Zalera</option>
            <option :value="75">Malboro</option>
            <option :value="81">Goblin</option>
            <option :value="74">Coeurl</option>
            <option :value="34">Brynhildr</option>
            <option :value="62">Diabolos</option>
            <option :value="91">Balmung</option>
            <option :value="37">Mateus</option>
        </select>
        <br>
        <button @click="getMedianSoldPrices">Go</button>
        <div>{{ datadump }}</div>

        <table>
            <tr>
                <th>World</th>
                <th>Median Sale Price</th>
                <th>Difference</th>
            </tr>
            <tr v-for="medianSaleData of medianSalePrices">
                <td>{{medianSaleData.worldName}}</td>
                <td>{{medianSaleData.medianSalePrice}}</td>
                <td>{{medianSaleData.priceDifference}}</td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    data() {
        return{
            medianSalePrices: [],
            response: null,
            itemID: 35862,
            datadump: null,
            selectedWorld: 93,
            selectedWorldPrice: null
        }
    },
    async mounted() {
        // await this.getMedianSoldPrice();
    },
    methods: {
        async getMedianSoldPrices() {
            if (!this.itemID || !this.selectedWorld) return;
            this.medianSalePrices = [];
            const data = await this.$axios.$get(`http://localhost:4001/api/getMedianSoldPrice/${this.itemID}/${this.selectedWorld}`);
            this.selectedWorldPrice = data.selectedWorldPrice;
            console.log(this.selectedWorld);
            for (let saleData of data.medianPriceData) {
                this.medianSalePrices.push({
                    worldName: saleData.worldName,
                    medianSalePrice: saleData.medianSalePrice,
                    priceDifference: this.selectedWorldPrice - saleData.medianSalePrice
                });
            }
        },
        // async updateMarketData() {
        //     const response = await this.$axios.$get('/api/updateSaleData');
        //     this.response = response;
        // }
    },
    name: 'IndexPage'
}
</script>
