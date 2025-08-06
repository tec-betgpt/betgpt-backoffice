import api from './base.js'

export default {
    /**
     *
     */
    async getListSessions(){
        const {data} = await api.get(`ia/list`)
        return data;
    },

    async getSessions(){
        const {data} = await api.get(`ia/session`)
        return data;
    },

    async sendMessage(){
        const {data} = await api.get(`ia/messages`)
        return data;
    },

    async createSession(){
        const {data} = await api.get(`ia/create`)
        return data;
    },

    async deleteSession(){
        const {data} = await api.get(`ia/delete`)
        return data;
    },

}