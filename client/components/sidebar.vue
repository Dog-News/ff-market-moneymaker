
<template>
    <div id="sidebar">
        <div id="sidebar-inner">
            <div class="sidebar-logo px-4">
                <a href="/" class="sidebar-logo-link">
                    <span class="sidebar-logo-text">XIV Markets</span>
                </a>
            </div>
            <div class="sidebar-nav py-5">
                <div class="sidebar-nav-label text-light mb-2 px-4">Market Tools</div>
                <ul class="sidebar-nav-items">
                    <li class="sidebar-nav-item">
                        <NuxtLink to="/" exact class="py-2 px-4">
                            <span class="nav-icon-box border rounded mr-2" style="padding: 2px;--fa-secondary-opacity: 0.50"><i class="fa-sharp-duotone fa-coin fa-swap-opacity fa-fw"></i></span>
                            <span class="sidebar-nav-text">Reselling</span>
                        </NuxtLink>
                    </li>
                    
                    <li class="sidebar-nav-item">
                        <NuxtLink to="/crafts" class="py-2 px-4">
                            <span class="nav-icon-box border rounded mr-2" style="padding: 2px;--fa-secondary-opacity: 0.50"><i class="fa-sharp-duotone fa-hammer fa-fw"></i></span>
                            <span class="sidebar-nav-text">Crafting</span>
                        </NuxtLink>
                    </li>
                    <li class="sidebar-nav-item">
                        <NuxtLink to="/crystals" class="py-2 px-4">
                            <span class="nav-icon-box border rounded mr-2" style="padding: 2px;--fa-secondary-opacity: 0.50"><i class="fa-sharp-duotone fa-gem fa-fw"></i></span>
                            <span class="sidebar-nav-text">Crystals</span>
                        </NuxtLink>
                    </li>
                </ul>
                <div class="sidebar-nav-label text-light mb-2 px-4">Frequent Sales</div>
                <ul class="sidebar-nav-items">
                    <li class="sidebar-nav-item">
                        <NuxtLink to="/gear" class="py-2 px-4">
                            <span class="nav-icon-box border rounded mr-2" style="padding: 2px;--fa-secondary-opacity: 0.50"><i class="fa-sharp-duotone fa-sword fa-swap-opacity fa-fw"></i></span>
                            <span class="sidebar-nav-text">Gear</span>
                        </NuxtLink>
                    </li>
                    <li class="sidebar-nav-item">
                        <NuxtLink to="/consumables" class="py-2 px-4">
                            <span class="nav-icon-box border rounded mr-2" style="padding: 2px;--fa-secondary-opacity: 0.50"><i class="fa-sharp-duotone fa-pot-food fa-fw"></i></span>
                            <span class="sidebar-nav-text">Consumables</span>
                        </NuxtLink>
                    </li>
                    <li class="sidebar-nav-item">
                        <NuxtLink to="/materia" exact class="py-2 px-4">
                            <span class="nav-icon-box border rounded mr-2" style="padding: 2px;--fa-secondary-opacity: 0.50"><i class="fa-sharp-duotone fa-crystal-ball fa-swap-opacity fa-fw"></i></span>
                            <span class="sidebar-nav-text">Materia</span>
                        </NuxtLink>
                    </li>
                </ul>
            </div>
            <div id="sidebar-bottom">
            <div class="sidebar-nav-label text-light mb-2 px-4">Server</div>
            <div class="d-flex pb-4 px-4">
                
          
                <b-form-select id="server-select" @change="handleChange" v-model="selectedDataCenter" :options="options" class="custom-select"></b-form-select>

                <!-- <button class="btn btn-primary ml-2" @click="test">Go</button>
                <div>{{ datadump }}</div> -->
            </div>
            <div class="sidebar-nav border-top pt-3">
                <ul class="sidebar-nav-items">
                    <li class="sidebar-nav-item">
                        <NuxtLink to="/admin" class="py-2 px-4">
                            <span class="nav-icon-box border rounded mr-2" style="padding: 2px;--fa-secondary-opacity: 0.50"><i class="fa-sharp-duotone fa-toolbox fa-fw"></i></span>
                            <span class="sidebar-nav-text">Admin</span>
                        </NuxtLink>
                    </li>
                </ul>
            </div>
            </div>
        </div>    
    </div>
</template>

<script>
export default {
    data() {
        return {
            selectedDataCenter: this.$store.state.selectedDataCenter || 'Primal', // Default to Primal if not in store
            options: [
          { value: 'Aether', text: 'Aether' },
          { value: 'Primal', text: 'Primal' },
          { value: 'Crystal', text: 'Crystal' },
          { value: 'Dynamis', text: 'Dynamis' },

        ]
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

<style>
#sidebar-inner {
    position: sticky;
    top: 16px;
    height: calc(100vh - 16px);
}
#sidebar-bottom {
    position: absolute;
    bottom: 16px;
    width: 100%;
}
#server-select {
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    color: white;
  
    background: rgba(255,255,255,.05) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5' viewBox='0 0 4 5'%3e%3cpath fill='white' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e") right 0.75rem center/8px 10px no-repeat!important;
}
#server-select option {
    color: black;
}
.nav-icon-box {
    border-color: rgba(255,255,255,.25)!important;
    background: linear-gradient(225deg, rgba(255,255,255,.20), transparent)
}
.sidebar-nav-label {
    text-transform: uppercase; letter-spacing: 2px; font-size: 12px;
}
.sidebar-nav-item {
    font-size: 18px;
    display: flex;
}
.sidebar-nav-item a {
    width: 100%;
    transition: all 400ms;
    background: transparent;
    background-position:-200px;
    background-repeat: no-repeat;
}
.sidebar-nav-item a.nuxt-link-active {
background: linear-gradient(90deg, #215297, transparent);
position: relative;
}
.sidebar-nav-item a:hover {
    text-decoration: none;
    background: linear-gradient(90deg, #215297, transparent);
    transition: all 400ms;
    background-position:0;
    background-repeat: no-repeat;
}
.sidebar-nav-text {

font-weight: 400;
}
#sidebar .border-top {
    border-color: rgba(255,255,255,0.2)!important;
}

.sidebar-logo {
    font-size: 30px;
    line-height: 86px;
    font-weight: 300;
    height: 86px;
    display: flex;
}
.sidebar-logo-link {
    color: white;
}

.sidebar-nav ul {
    list-style: none;
    padding-left: 0;
}
.sidebar-nav a {
    color: white;
}

</style>