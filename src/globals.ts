var pageInfo = null;

export function loadPageInfo() {
    if(window.iedibAPI) {
        pageInfo = window.iedibAPI.getPageInfo();
        console.log(pageInfo);
    }
}

export const cfg = {
    BASE_URL:  "https://piworld.es/iedib/matheditor",
    pageInfo: pageInfo
} 
