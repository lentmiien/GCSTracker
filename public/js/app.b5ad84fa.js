(function(t){function e(e){for(var n,i,c=e[0],s=e[1],u=e[2],l=0,p=[];l<c.length;l++)i=c[l],Object.prototype.hasOwnProperty.call(a,i)&&a[i]&&p.push(a[i][0]),a[i]=0;for(n in s)Object.prototype.hasOwnProperty.call(s,n)&&(t[n]=s[n]);d&&d(e);while(p.length)p.shift()();return o.push.apply(o,u||[]),r()}function r(){for(var t,e=0;e<o.length;e++){for(var r=o[e],n=!0,i=1;i<r.length;i++){var s=r[i];0!==a[s]&&(n=!1)}n&&(o.splice(e--,1),t=c(c.s=r[0]))}return t}var n={},a={app:0},o=[];function i(t){return c.p+"js/"+({about:"about"}[t]||t)+"."+{about:"65d44e9a"}[t]+".js"}function c(e){if(n[e])return n[e].exports;var r=n[e]={i:e,l:!1,exports:{}};return t[e].call(r.exports,r,r.exports,c),r.l=!0,r.exports}c.e=function(t){var e=[],r=a[t];if(0!==r)if(r)e.push(r[2]);else{var n=new Promise((function(e,n){r=a[t]=[e,n]}));e.push(r[2]=n);var o,s=document.createElement("script");s.charset="utf-8",s.timeout=120,c.nc&&s.setAttribute("nonce",c.nc),s.src=i(t);var u=new Error;o=function(e){s.onerror=s.onload=null,clearTimeout(l);var r=a[t];if(0!==r){if(r){var n=e&&("load"===e.type?"missing":e.type),o=e&&e.target&&e.target.src;u.message="Loading chunk "+t+" failed.\n("+n+": "+o+")",u.name="ChunkLoadError",u.type=n,u.request=o,r[1](u)}a[t]=void 0}};var l=setTimeout((function(){o({type:"timeout",target:s})}),12e4);s.onerror=s.onload=o,document.head.appendChild(s)}return Promise.all(e)},c.m=t,c.c=n,c.d=function(t,e,r){c.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},c.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},c.t=function(t,e){if(1&e&&(t=c(t)),8&e)return t;if(4&e&&"object"===typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(c.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)c.d(r,n,function(e){return t[e]}.bind(null,n));return r},c.n=function(t){var e=t&&t.__esModule?function(){return t["default"]}:function(){return t};return c.d(e,"a",e),e},c.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},c.p="/",c.oe=function(t){throw console.error(t),t};var s=window["webpackJsonp"]=window["webpackJsonp"]||[],u=s.push.bind(s);s.push=e,s=s.slice();for(var l=0;l<s.length;l++)e(s[l]);var d=u;o.push([0,"chunk-vendors"]),r()})({0:function(t,e,r){t.exports=r("56d7")},"56d7":function(t,e,r){"use strict";r.r(e);r("e260"),r("e6cf"),r("cca6"),r("a79d");var n=r("2b0e"),a=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{attrs:{id:"app"}},[r("div",{attrs:{id:"nav"}},[r("router-link",{attrs:{to:"/"}},[t._v("Home")]),t._v("| "),r("router-link",{attrs:{to:"/about"}},[t._v("About")])],1),r("router-view")],1)},o=[],i=r("2f62"),c={name:"app",methods:Object(i["b"])(["fetchTrackings"]),created:function(){this.fetchTrackings()}},s=c,u=r("2877"),l=Object(u["a"])(s,a,o,!1,null,null,null),d=l.exports,p=(r("d3b7"),r("8c4f")),f=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{staticClass:"container-fluid"},[r("div",{staticClass:"row mt-3"},[r("div",{staticClass:"col"},[t.$route.query.start?r("h2",[t._v("Undelivered records for "+t._s(new Date(parseInt(t.$route.query.start)).toDateString())+" - "+t._s(new Date(parseInt(t.$route.query.end)).toDateString()))]):r("h2",[t._v("All undelivered records")]),r("p",[t._v("Total records: "+t._s(t.filterdata().length))]),r("TrackingList",{attrs:{data:t.filterdata()}})],1)])])},g=[],v=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("table",{staticClass:"table table-striped table-dark"},[t._m(0),r("tbody",t._l(t.data,(function(e){return r("tr",{key:e.id,class:{"bg-success":e.done}},[r("td",[r("router-link",{attrs:{to:t.detailslink(e.tracking)}},[t._v(t._s(e.tracking))])],1),r("td",[t._v(t._s(e.status))]),r("td",[t._v(t._s(new Date(e.shippeddate).toLocaleDateString("ja-JP")))]),r("td",[t._v("-")]),r("td",[t._v(t._s(0==e.delivereddate?"Not arrived":e.shippeddate>=e.delivereddate?"Arrived":new Date(e.delivereddate).toLocaleDateString("ja-JP")))])])})),0)])},m=[function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("thead",[r("tr",[r("th",{attrs:{scope:"col"}},[t._v("Tracking number")]),r("th",{attrs:{scope:"col"}},[t._v("Status")]),r("th",{attrs:{scope:"col",colspan:"3"}},[t._v("Date")])])])}],k={name:"TrackingList",props:["data"],methods:{detailslink:function(t){return"/trackingdetails?tracking=".concat(t)}}},h=k,b=Object(u["a"])(h,v,m,!1,null,"74a3da06",null),_=b.exports,w={name:"Undelivered",components:{TrackingList:_},computed:Object(i["c"])(["allTrackingData"]),methods:{filterdata:function(){return this.allTrackingData}}},y=w,T=Object(u["a"])(y,f,g,!1,null,null,null),j=T.exports;n["a"].use(p["a"]);var O=[{path:"/",name:"Home",component:j},{path:"/about",name:"About",component:function(){return r.e("about").then(r.bind(null,"f820"))}}],x=new p["a"]({routes:O}),D=x,P=(r("99af"),r("4de4"),r("96cf"),r("1da1")),R=r("7338"),S=r.n(R),$={trackings:[]},E={allTrackingData:function(t){return t.trackings}},L={fetchTrackings:function(t){return Object(P["a"])(regeneratorRuntime.mark((function e(){var r,n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return r=t.commit,e.next=3,S.a.get("/api/getall");case 3:n=e.sent,r("setTrackings",n.data);case 5:case"end":return e.stop()}}),e)})))()},addRecords:function(t,e){return Object(P["a"])(regeneratorRuntime.mark((function r(){var n,a;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return n=t.commit,r.next=3,S.a.post("/api/add",e);case 3:a=r.sent,n("addTrackings",a.data);case 5:case"end":return r.stop()}}),r)})))()},updateRecord:function(t,e){return Object(P["a"])(regeneratorRuntime.mark((function r(){var n,a,o,i;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return n=t.commit,a=e.action,o=e.tracking,r.next=4,S.a.post("/api/update",{action:a,tracking:o});case 4:i=r.sent,n("updateTrackings",{trackings:i.data,tracking:o});case 6:case"end":return r.stop()}}),r)})))()},deleteRecord:function(t,e){return Object(P["a"])(regeneratorRuntime.mark((function r(){var n,a,o;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return n=t.commit,a=e.action,o=e.tracking,r.next=4,S.a.post("/api/update",{action:a,tracking:o});case 4:n("deleteTrackings",o);case 5:case"end":return r.stop()}}),r)})))()}},C={setTrackings:function(t,e){return t.trackings=e},addTrackings:function(t,e){return t.trackings=t.trackings.concat(e)},updateTrackings:function(t,e){var r=e.trackings,n=e.tracking;return t.trackings=t.trackings.filter((function(t){return t.tracking!=n})).concat(r)},deleteTrackings:function(t,e){return t.trackings=t.trackings.filter((function(t){return t.tracking!=e}))}},A={state:$,getters:E,actions:L,mutations:C};n["a"].use(i["a"]);var q=new i["a"].Store({state:{},mutations:{},actions:{},modules:{Trackings:A}});n["a"].config.productionTip=!1,new n["a"]({router:D,store:q,render:function(t){return t(d)}}).$mount("#app")}});
//# sourceMappingURL=app.b5ad84fa.js.map