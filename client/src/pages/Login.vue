<template>
    <div class="login center-horizontally">
        <div>
            <div id="logo"></div>
            <div id="loginContainerWrapper">
                <div id="loginContainer" class="card box-shadow">
                    <div>
                        <h1>Login</h1>
                    </div>
                    <div>
                        <form v-on:submit.prevent="login">
                            <div>
                                <label for="username">Username:</label>
                                <input id="username" type="text" autofocus required v-model="username"/>
                            </div>
                            <div>
                                <label for="password">Password:</label>
                                <input id="password" type="password" ref="password" required v-model="password"/>
                            </div>
                            <div id="keepSessionWrapper">
                                <label>Keep Session <input v-model="keepSession" type="checkbox"/></label>
                            </div>
                            <p id="lastError">{{lastError}}<p/>
                            <button id="loginButton" type="submit" class="button button--blue" v-bind:disabled="!enableLogin">Login</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import {ApiClient} from '../libs/ApiClient';

@Component({
    components: {
    },
})
export default class Login extends Vue {

    private username: string = '';

    private password: string = '';

    private keepSession: boolean = true;

    private lastError: string = '';

    private enableLogin: boolean = true;

    private async login() {
        this.enableLogin = false;
        try {
            await ApiClient.login(this.username, this.password, this.keepSession);
            this.$router.push('/fabric');
        } catch (e) {
            this.lastError = e.message;
        }
        this.password = '';
        (this.$refs.password as HTMLInputElement).focus();
        this.enableLogin = true;
    }
}
</script>

<style scoped>

    #loginContainerWrapper {
        display: flex;
        justify-content: center;
    }

    #logo {
        height: 200px;
        width: 400px;
        background: url('../assets/logo.svg');
        margin-bottom: 50px;
        margin-top: 80px;
    }

    #username,
    #password {
        width: 300px;
        display: block;
        font-size: 20px;
        margin-bottom: 10px;
        border: 1px solid var(--border-gray);
        border-radius: var(--border-radius);
    }

    #loginContainer {
        padding: 30px;
    }

    #loginContainer h1 {
        text-align: center;
    }

    #loginButton {
        width: 100%;
        font-size: 20px;
    }

    #keepSessionWrapper {
        margin-bottom: 10px;
    }

    #lastError {
        display: block;
        color: #ff0000;
        height: 10px;
        width: 100%;
        font-size: 12px;
        margin: 0;
    }

</style>
