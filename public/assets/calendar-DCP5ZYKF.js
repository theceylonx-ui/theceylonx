import{c as Z,r as g,k as ee,j as e,P as te,l as ae,o as se,s as re,g as le,a as ne,u as F,L as w,T as ie,t as oe,v as de,w as ce}from"./index-6SAWRG5u.js";import{D as me}from"./index.esm-CbhjYZG8.js";/* empty css              */import{C,b as M,c as P,a as I,B as u}from"./button-BKPE7OF5.js";import{B as N,U as ge}from"./badge-Dq5OE9eO.js";import{S as xe,N as he}from"./navigation-B7AnbNzU.js";import{M as L}from"./map-pin-BeIIM8hb.js";import{H as z}from"./heart-C_y1rpq_.js";import{P as A}from"./pin-B9eKWmTY.js";import{S as U}from"./star-B4Ibiyu-.js";import{U as R}from"./user-Bx_o3Tgx.js";import{L as fe}from"./lock-BuaBHhgU.js";import{C as pe}from"./clock-C1o8CfbN.js";import{D as ue}from"./dollar-sign-W1Wj82Ig.js";import{f}from"./format-DcUQE4zY.js";import{F as be}from"./Footer-BqWUUYIa.js";import{T as ye}from"./TipsBox-D30nyEa4.js";import"./5_1756417819316-pd480Joi.js";import"./profileUtils-DSR4Nh5p.js";import"./check--T8QgiEV.js";import"./trash-2-lDn7_Tkw.js";import"./iconBase-9eN0KVEF.js";import"./sparkles-CqnA8pej.js";import"./chevron-down-DiX6oIKz.js";import"./chevron-up-DjMz_jxL.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=Z("CalendarPlus",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8",key:"3spt84"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M16 19h6",key:"xwg31i"}],["path",{d:"M19 16v6",key:"tddt3s"}]]);var je="Toggle",V=g.forwardRef((a,l)=>{const{pressed:o,defaultPressed:i=!1,onPressedChange:m,...x}=a,[h=!1,n]=ee({prop:o,onChange:m,defaultProp:i});return e.jsx(te.button,{type:"button","aria-pressed":h,"data-state":h?"on":"off","data-disabled":a.disabled?"":void 0,...x,ref:l,onClick:ae(a.onClick,()=>{a.disabled||n(!h)})})});V.displayName=je;var H=V;const ve=re("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",{variants:{variant:{default:"bg-transparent",outline:"border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"},size:{default:"h-10 px-3 min-w-10",sm:"h-9 px-2.5 min-w-9",lg:"h-11 px-5 min-w-11"}},defaultVariants:{variant:"default",size:"default"}}),O=g.forwardRef(({className:a,variant:l,size:o,...i},m)=>e.jsx(H,{ref:m,className:se(ve({variant:l,size:o,className:a})),...i}));O.displayName=H.displayName;const we=()=>{var o,i,m,x,h,n,b;const a=new URLSearchParams(window.location.search),l=new Date;return{selectedDate:a.get("date")||localStorage.getItem("calendar_date")||f(l,"yyyy-MM-dd"),view:a.get("view")||localStorage.getItem("calendar_view")||"month",filters:{all:((o=a.get("filters"))==null?void 0:o.includes("all"))||localStorage.getItem("calendar_filters_all")==="true"||!1,pinned:((i=a.get("filters"))==null?void 0:i.includes("pinned"))||localStorage.getItem("calendar_filters_pinned")==="true"||!1,interested:((m=a.get("filters"))==null?void 0:m.includes("interested"))||localStorage.getItem("calendar_filters_interested")==="true"||!1,my:((x=a.get("filters"))==null?void 0:x.includes("my"))||localStorage.getItem("calendar_filters_my")==="true"||!1,free:((h=a.get("filters"))==null?void 0:h.includes("free"))||localStorage.getItem("calendar_filters_free")==="true"||!1},region:a.get("region")||localStorage.getItem("calendar_region")||null,tags:((n=a.get("tags"))==null?void 0:n.split(",").filter(Boolean))||((b=localStorage.getItem("calendar_tags"))==null?void 0:b.split(",").filter(Boolean))||[]}},B=a=>{localStorage.setItem("calendar_date",a.selectedDate),localStorage.setItem("calendar_view",a.view),localStorage.setItem("calendar_filters_all",a.filters.all.toString()),localStorage.setItem("calendar_filters_pinned",a.filters.pinned.toString()),localStorage.setItem("calendar_filters_interested",a.filters.interested.toString()),localStorage.setItem("calendar_filters_my",a.filters.my.toString()),localStorage.setItem("calendar_filters_free",a.filters.free.toString()),localStorage.setItem("calendar_region",a.region||""),localStorage.setItem("calendar_tags",a.tags.join(","))},K=a=>{const l=new URLSearchParams;l.set("date",a.selectedDate),l.set("view",a.view);const o=[];a.filters.all&&o.push("all"),a.filters.pinned&&o.push("pinned"),a.filters.interested&&o.push("interested"),a.filters.my&&o.push("my"),a.filters.free&&o.push("free"),o.length>0&&l.set("filters",o.join(",")),a.region&&l.set("region",a.region),a.tags.length>0&&l.set("tags",a.tags.join(","));const i=`${window.location.pathname}?${l.toString()}`;window.history.replaceState({},"",i)},S=a=>{const l=[];return a.all&&l.push("all"),a.pinned&&l.push("pinned"),a.interested&&l.push("interested"),a.my&&l.push("my"),a.free&&l.push("truly_free"),l.join(",")},Ne=(a,l)=>{const[o,i]=g.useState(a);return g.useEffect(()=>{const m=setTimeout(()=>i(a),l);return()=>clearTimeout(m)},[a,l]),o},Se=({className:a})=>{var E;const{user:l,isAuthenticated:o}=le();ne();const[i,m]=g.useState(we),[x,h]=g.useState(!0),n=Ne(i,300),b=g.useCallback(t=>{m(s=>{const r={...s,...t};return B(r),K(r),r})},[]),y=g.useCallback(t=>{if(t){const s=f(t,"yyyy-MM-dd");b({selectedDate:s})}},[b]),Y=g.useCallback(t=>{!o&&["pinned","interested","my"].includes(t)||m(s=>{let r={...s.filters};t==="all"&&!s.filters.all?r={all:!0,pinned:!1,interested:!1,my:!1,free:!1}:t!=="all"?r={...s.filters,all:!1,[t]:!s.filters[t]}:r[t]=!s.filters[t];const d={...s,filters:r};return setTimeout(()=>{B(d),K(d)},100),d})},[o]),k=g.useCallback(t=>{if(t.target!==document.body)return;const s=new Date(i.selectedDate+"T00:00:00");let r=null;switch(t.key){case"ArrowLeft":t.preventDefault(),r=new Date(s),r.setDate(s.getDate()-1);break;case"ArrowRight":t.preventDefault(),r=new Date(s),r.setDate(s.getDate()+1);break;case"ArrowUp":t.preventDefault(),r=new Date(s),r.setDate(s.getDate()-7);break;case"ArrowDown":t.preventDefault(),r=new Date(s),r.setDate(s.getDate()+7);break;case"Enter":t.preventDefault(),h(!x);break}r&&y(r)},[i.selectedDate,x,y]);g.useEffect(()=>(document.addEventListener("keydown",k),()=>document.removeEventListener("keydown",k)),[k]);const{data:c,isLoading:Q,error:D}=F({queryKey:["calendar-day",n.selectedDate,S(n.filters),n.region||"",n.tags.join(",")],queryFn:async()=>{const t=new URLSearchParams;t.set("date",n.selectedDate);const s=S(n.filters);s&&t.set("filters",s),n.region&&t.set("region",n.region),n.tags.length>0&&t.set("tags",n.tags.join(","));const r=await fetch(`/api/calendar/day?${t.toString()}`,{credentials:"include"});if(!r.ok)throw new Error(`${r.status}: ${r.statusText}`);return r.json()},enabled:!0,staleTime:2*60*1e3,retry:(t,s)=>{var r,d;return(r=s==null?void 0:s.message)!=null&&r.includes("401")||(d=s==null?void 0:s.message)!=null&&d.includes("Unauthorized")?!1:t<2}}),$=f(new Date(i.selectedDate+"T00:00:00"),"yyyy-MM"),{data:_}=F({queryKey:["calendar-month",$,S(n.filters),n.region||"",n.tags.join(",")],queryFn:async()=>{const t=new URLSearchParams;t.set("month",$),t.set("summary","true");const s=S(n.filters);s&&t.set("filters",s),n.region&&t.set("region",n.region),n.tags.length>0&&t.set("tags",n.tags.join(","));const r=await fetch(`/api/calendar/month?${t.toString()}`,{credentials:"include"});if(!r.ok)throw new Error(`${r.status}: ${r.statusText}`);return r.json()},enabled:!0,staleTime:5*60*1e3,retry:!1}),G=new Map((_==null?void 0:_.days.map(t=>[t.date,t.count]))||[]),J=(t,s)=>{const r=f(t,"yyyy-MM-dd"),d=G.get(r)||0,v=r===i.selectedDate,p=d>0,X=t.getMonth()!==s.getMonth();return e.jsxs("div",{className:`relative w-full h-full flex flex-col items-center justify-center p-1 transition-colors ${v?"bg-ceylon-green text-white rounded-md":"hover:bg-gray-100"}`,"aria-label":`${f(t,"MMMM d, yyyy")} — ${d} trips`,role:"button",tabIndex:0,onKeyDown:T=>{(T.key==="Enter"||T.key===" ")&&(T.preventDefault(),y(t))},children:[e.jsx("span",{className:`text-sm ${p?"font-bold":"font-normal"} ${v?"text-white":X?"text-gray-400":p?"text-ceylon-green":"text-gray-700"}`,children:f(t,"d")}),d>0&&e.jsx(N,{variant:"secondary",className:"absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center bg-ceylon-green text-white",children:d>9?"9+":d})]})},W=({trip:t})=>e.jsxs("div",{className:"relative group overflow-hidden bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]","data-testid":`trip-card-${t.id}`,children:[t.flags&&e.jsxs("div",{className:"absolute top-3 right-3 flex gap-1",children:[t.flags.mine&&e.jsx("div",{className:"w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center",children:e.jsx(R,{className:"h-3 w-3 text-blue-600"})}),t.flags.pinned&&e.jsx("div",{className:"w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center",children:e.jsx(A,{className:"h-3 w-3 text-orange-600"})}),t.flags.interested&&e.jsx("div",{className:"w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center",children:e.jsx(U,{className:"h-3 w-3 text-yellow-600"})})]}),e.jsx("div",{className:"mb-3 pr-12",children:e.jsx("h4",{className:"font-semibold text-base text-gray-900 line-clamp-2 leading-tight",children:t.title})}),e.jsx("div",{className:"mb-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-100",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(L,{className:"h-4 w-4 text-emerald-600 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("div",{className:"text-sm font-medium text-gray-800 truncate",children:t.fromLocation}),e.jsx("div",{className:"text-xs text-gray-600 mt-1",children:"to"}),e.jsx("div",{className:"text-sm font-medium text-gray-800 truncate",children:t.toLocation})]})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-3 mb-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center",children:e.jsx(pe,{className:"h-4 w-4 text-blue-600"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-xs text-gray-500",children:"Time"}),e.jsx("div",{className:"text-sm font-medium text-gray-800",children:t.time})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center",children:e.jsx(ge,{className:"h-4 w-4 text-purple-600"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-xs text-gray-500",children:"Seats"}),e.jsx("div",{className:"text-sm font-medium text-gray-800",children:t.seatsAvailable})]})]})]}),e.jsx("div",{className:"mb-4",children:t.price&&Number(t.price)>0?e.jsxs("div",{className:"flex items-center gap-2 p-2 bg-orange-50 rounded-lg",children:[e.jsx("div",{className:"w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center",children:e.jsx(ue,{className:"h-4 w-4 text-orange-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-gray-500",children:"Price"}),e.jsxs("div",{className:"text-sm font-semibold text-orange-700",children:["LKR ",t.price]})]})]}):e.jsxs("div",{className:"flex items-center gap-2 p-2 bg-green-50 rounded-lg",children:[e.jsx("div",{className:"w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center",children:e.jsx(z,{className:"h-4 w-4 text-green-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs text-gray-500",children:"Price"}),e.jsx("div",{className:"text-sm font-semibold text-green-700",children:"Free Trip"})]})]})}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-gray-100",children:[e.jsx(N,{variant:"outline",className:"text-xs bg-gray-50 border-gray-200 text-gray-600",children:t.region}),e.jsx(w,{href:`/trips/${t.id}`,children:e.jsx(u,{size:"sm",className:"bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200",children:"View Details"})})]})]}),j=({filterKey:t,icon:s,label:r,requiresAuth:d=!1})=>{const v=i.filters[t],p=d&&!o;return e.jsx(ie,{children:e.jsxs(oe,{children:[e.jsx(de,{asChild:!0,children:e.jsxs(O,{pressed:v,onPressedChange:()=>Y(t),disabled:p,className:`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[60px] sm:min-h-[44px] rounded-lg transition-all duration-200 ${v?"bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105":"bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"} ${p?"opacity-50 cursor-not-allowed":"hover:shadow-md"}`,"data-testid":`filter-${t}`,children:[e.jsx(s,{className:"h-4 w-4 sm:h-3 sm:w-3 flex-shrink-0"}),e.jsx("span",{className:"text-center sm:text-left font-medium",children:r})]})}),e.jsx(ce,{children:p?"Sign in to use this filter":`Toggle ${r.toLowerCase()}`})]})})};return e.jsxs("div",{className:`w-full space-y-4 sm:space-y-6 ${a}`,children:[e.jsxs(C,{className:"overflow-hidden border-2 border-gray-100 shadow-sm",children:[e.jsx(M,{className:"bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4",children:e.jsxs(P,{className:"text-xl font-semibold flex items-center justify-between",children:[e.jsx("span",{className:"bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent",children:"Trip Filters"}),e.jsxs(N,{variant:"outline",className:"bg-emerald-50 border-emerald-200 text-emerald-700 font-medium px-3 py-1",children:[Object.values(i.filters).filter(Boolean).length," active"]})]})}),e.jsx(I,{className:"p-4 sm:p-6",children:e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3",children:[e.jsx(j,{filterKey:"all",icon:L,label:"All Trips"}),e.jsx(j,{filterKey:"free",icon:z,label:"Free Trips"}),e.jsx(j,{filterKey:"pinned",icon:A,label:"Pinned",requiresAuth:!0}),e.jsx(j,{filterKey:"interested",icon:U,label:"Interested",requiresAuth:!0}),e.jsx(j,{filterKey:"my",icon:R,label:"My Trips",requiresAuth:!0})]})})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6",children:[e.jsxs(C,{className:"overflow-hidden",children:[e.jsx(M,{className:"bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30",children:e.jsx(P,{className:"text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent",children:"Calendar"})}),e.jsxs(I,{className:"p-2 sm:p-4",children:[e.jsx("style",{children:`
              .enhanced-calendar {
                --rdp-cell-size: 48px;
                --rdp-accent-color: #059669;
                --rdp-background-color: #f0fdf4;
                --rdp-accent-color-dark: #065f46;
                --rdp-background-color-dark: #064e3b;
                --rdp-outline: 2px solid var(--rdp-accent-color);
                --rdp-outline-selected: 3px solid var(--rdp-accent-color);
                font-size: 14px;
              }
              
              @media (max-width: 640px) {
                .enhanced-calendar {
                  --rdp-cell-size: 44px;
                  font-size: 13px;
                }
              }
              
              .enhanced-calendar .rdp-table {
                width: 100%;
                max-width: none;
              }
              
              .enhanced-calendar .rdp-cell {
                padding: 2px;
                position: relative;
              }
              
              .enhanced-calendar .rdp-button {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                border-radius: 12px;
                font-weight: 500;
                border: 2px solid transparent;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
              }
              
              .enhanced-calendar .rdp-button:hover {
                background-color: #f0fdf4;
                border-color: #a7f3d0;
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(6, 95, 70, 0.15);
              }
              
              .enhanced-calendar .rdp-button.rdp-day_selected {
                background: linear-gradient(135deg, #059669, #0891b2);
                color: white;
                border-color: #047857;
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
                transform: scale(1.1);
              }
              
              .enhanced-calendar .rdp-button.rdp-day_today {
                border-color: #fbbf24;
                background-color: #fef3c7;
                color: #92400e;
                font-weight: 600;
              }
              
              .enhanced-calendar .rdp-head_cell {
                font-weight: 600;
                color: #374151;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 8px 0;
              }
              
              .enhanced-calendar .day-badge {
                position: absolute;
                top: -2px;
                right: -2px;
                min-width: 18px;
                height: 18px;
                border-radius: 10px;
                background: linear-gradient(135deg, #dc2626, #ef4444);
                color: white;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
                z-index: 10;
                animation: pulse 2s infinite;
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
              }
              
              .enhanced-calendar .day-content {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .enhanced-calendar .rdp-button.rdp-day_outside {
                color: #9ca3af !important;
                opacity: 0.6;
              }
              
              .enhanced-calendar .rdp-button.rdp-day_outside:hover {
                background-color: #f9fafb;
                color: #6b7280 !important;
              }
              
              .enhanced-calendar .rdp-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
              }
              
              .enhanced-calendar .rdp-caption {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                margin: 0;
              }
              
              .enhanced-calendar .rdp-caption_label {
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin: 0;
              }
              
              .enhanced-calendar .rdp-nav_button {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                border: 1px solid #d1d5db;
                background: white;
                color: #374151;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                margin: 0 8px;
              }
              
              .enhanced-calendar .rdp-nav_button:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
                transform: scale(1.05);
              }
              
              .enhanced-calendar .rdp-nav_button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}),e.jsx(me,{mode:"single",selected:new Date(i.selectedDate+"T00:00:00"),onSelect:y,className:"enhanced-calendar w-full",showOutsideDays:!0,components:{Day:({date:t,displayMonth:s,...r})=>e.jsx("div",{...r,onClick:()=>y(t),className:"day-content",children:J(t,s)})}})]})]}),x&&e.jsxs(C,{className:"overflow-hidden shadow-lg border-2 border-gradient",children:[e.jsx(M,{className:"bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 pb-4",children:e.jsx(P,{className:"text-xl font-semibold",children:e.jsxs("div",{className:"flex flex-col",children:[e.jsx("span",{className:"bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent",children:f(new Date(i.selectedDate+"T00:00:00"),"EEEE, MMMM d, yyyy")}),(c==null?void 0:c.total)&&e.jsxs("span",{className:"text-sm font-normal text-gray-600 mt-1",children:[c.total," trip",c.total!==1?"s":""," available"]})]})})}),e.jsx(I,{className:"p-4 sm:p-6",children:Q?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-3 border-emerald-200 border-t-emerald-500 mx-auto mb-4"}),e.jsx("p",{className:"text-gray-600 font-medium",children:"Loading trips..."})]}):(E=D==null?void 0:D.message)!=null&&E.includes("401")?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4",children:e.jsx(fe,{className:"h-10 w-10 text-gray-400"})}),e.jsx("h3",{className:"text-lg font-semibold text-gray-700 mb-2",children:"Sign in Required"}),e.jsx("p",{className:"text-gray-500 mb-6",children:"Sign in to see filtered trips and personalized content"}),e.jsx(u,{asChild:!0,className:"bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600",children:e.jsx(w,{href:"/login",children:"Sign In"})})]}):c!=null&&c.items.length?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"mb-6",children:e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-800",children:"Available Trips"}),e.jsxs(N,{variant:"outline",className:"bg-emerald-50 border-emerald-200 text-emerald-700",children:[c.items.length," of ",c.total]})]})}),e.jsxs(xe,{className:"h-[400px] sm:h-[450px] pr-4",children:[e.jsx("div",{className:"space-y-4",children:c.items.map((t,s)=>e.jsx("div",{className:"transform transition-all duration-200 hover:scale-[1.02]",style:{animationDelay:`${s*100}ms`},children:e.jsx(W,{trip:t})},t.id))}),c.total>c.items.length&&e.jsx("div",{className:"text-center mt-6 pt-4 border-t border-gray-100",children:e.jsx(u,{variant:"outline",size:"sm",className:"border-emerald-200 text-emerald-600 hover:bg-emerald-50",children:"Load More Trips"})})]})]}):e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4",children:e.jsx(L,{className:"h-10 w-10 text-emerald-500"})}),e.jsx("h3",{className:"text-lg font-semibold text-gray-700 mb-2",children:"No Trips Found"}),e.jsx("p",{className:"text-gray-500 mb-6",children:"No trips on this day with your current filters"}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3 justify-center",children:[e.jsx(u,{asChild:!0,variant:"outline",className:"border-emerald-200 text-emerald-600 hover:bg-emerald-50",children:e.jsx(w,{href:"/browse-trips",children:"Browse All Trips"})}),e.jsx(u,{asChild:!0,className:"bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600",children:e.jsx(w,{href:`/post?date=${i.selectedDate}`,children:"Post a Trip"})})]})]})})]})]})]})};function Je(){return e.jsxs("div",{className:"min-h-screen bg-gray-50",children:[e.jsx(he,{}),e.jsx("div",{className:"py-8",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[e.jsx("div",{className:"mb-8",children:e.jsx("div",{className:"bg-gradient-to-r from-ceylon-green to-ceylon-blue rounded-2xl p-8 text-white shadow-xl",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center space-x-3 mb-4",children:[e.jsx(q,{className:"w-8 h-8"}),e.jsx("h1",{className:"text-3xl md:text-4xl font-bold",children:"Your Calendar"})]}),e.jsx("p",{className:"text-lg opacity-90",children:"View all your trips, events, and plans in one place"})]}),e.jsx("div",{className:"hidden md:block",children:e.jsx(w,{href:"/post",children:e.jsxs(u,{variant:"secondary",size:"lg",className:"bg-white/20 text-white hover:bg-white/30 hover:text-white border-white/30",children:[e.jsx(q,{className:"w-5 h-5 mr-2"}),"Add Trip"]})})})]})})}),e.jsx(Se,{}),e.jsx("div",{className:"mt-16",children:e.jsx(ye,{title:"📅 Master Your Travel Calendar",tips:["Use <strong>filter toggles</strong> to view All Trips, Free Trips, Pinned, or My Trips","Look for <strong>bold dates with green badges</strong> - they show trip counts","Click any <strong>date</strong> to see all available trips in the preview panel","Use <strong>keyboard arrows</strong> to navigate dates quickly, Enter to toggle panel","Pin interesting trips with <strong>📌</strong> to easily find them later","Free trips show <strong>💚 Free Trip</strong> badge - perfect for budget travel"]})})]})}),e.jsx(be,{})]})}export{Je as default};
