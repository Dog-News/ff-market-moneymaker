
<template>
    <div id="sidebar">
        <div class="sidebar-inner px-4">
            <div class="sidebar-logo">
                <a href="/" class="sidebar-logo-link">
                    <span class="sidebar-logo-text">XIV Markets</span>
                </a>
            </div>
            <div class="sidebar-nav py-5">
                <ul class="sidebar-nav-items">
                    <li class="sidebar-nav-item">
                        <a href="/" class="sidebar-nav-link">
                            <font-awesome-icon icon="fa-solid fa-coin" />
                            <span class="sidebar-nav-text">Reselling</span>
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="/crafts" class="sidebar-nav-link">
                            <span class="sidebar-nav-text">Crafting</span>
                        </a>
                    </li>
                </ul>
            </div>
            <div class="sidebar-nav border-top pt-3">
                <ul class="sidebar-nav-items">
                    <li class="sidebar-nav-item">
                        <a href="/admin" class="sidebar-nav-link">
                            <span class="sidebar-nav-icon">
                                <i data-feather="server"></i>
                            </span>
                            <span class="sidebar-nav-text">Admin</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>    
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
</script>

<style>
.sidebar-nav-text {
font-size: 20px;
font-weight: 300;
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
.sidebar-nav li {
padding-bottom: 8px;
}
.sidebar-nav a {
    color: white;
}

</style>