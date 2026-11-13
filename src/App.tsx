import { api, load } from './storage.js';
import { parseICS as parseCalendar, exportICS as makeCalendar } from './calendar.js';
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Link2, Users, BedDouble, Wallet, LogIn, LogOut, Plus, X, Sparkles, ShieldAlert, MessageCircle, CheckCircle2, Clock3, Trash2, Eye, ArrowLeftRight, RefreshCw, ExternalLink } from "lucide-react";

type Reservation = { guest:string; email:string; roomId:number; checkin:string; checkout:string; dailyRate:number; total:number; origin:string; status:string; };
type IcalBlock = { roomId:number; start:string; end:string; summary:string; origin:string; };
type Rec<T> = { id:string; value:T; created_at:string; updated_at:string };

const CALENDAR_HELP_URL = "https://www.airbnb.com.br/help/article/99";

const ROOMS = [
  { id:1, name:"Quarto 1", type:"Vista Mar", capacity:2, rate:320 },
  { id:2, name:"Quarto 2", type:"Vista Mar", capacity:2, rate:320 },
  { id:3, name:"Quarto 3", type:"Família", capacity:4, rate:420 },
  { id:4, name:"Quarto 4", type:"Família", capacity:4, rate:420 },
  { id:5, name:"Quarto 5", type:"Econômico", capacity:2, rate:210 },
  { id:6, name:"Quarto 6", type:"Econômico", capacity:2, rate:210 },
];
const ORIGINS = ["Bairro Papo","Airbnb","Booking","WhatsApp","Telefone"];
const roomById = (id:number)=> ROOMS.find(r=>r.id===id);

function iso(d:Date){ return d.toISOString().slice(0,10); }
function addDays(base:string, n:number){ const d=new Date(base+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return iso(d); }
function todayISO(){ return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function parseBR(isoStr:string){ const [y,m,d]=isoStr.split("-").map(Number); return new Date(y,m-1,d,12,0,0); }
function fmtDate(isoStr:string){ return parseBR(isoStr).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); }
function fmtFull(isoStr:string){ return parseBR(isoStr).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}); }
function nights(a:string,b:string){ return Math.max(0, Math.round((parseBR(b).getTime()-parseBR(a).getTime())/86400000)); }
function money(v:number){ return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}); }
function fmtSyncNow(){ return new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}); }
function novDate(day:number){
  const year = new Date().getFullYear();
  return addDays(todayISO(), day-12);
}
const EXAMPLE_RESERVATIONS: Reservation[] = [
  { guest:"Marina e Rafael", email:"marina@exemplo.com", roomId:1, checkin:novDate(12), checkout:novDate(15), dailyRate:320, total:960, origin:"Airbnb", status:"Confirmada" },
  { guest:"Lucas Almeida", email:"lucas@exemplo.com", roomId:2, checkin:novDate(14), checkout:novDate(17), dailyRate:320, total:960, origin:"Airbnb", status:"Confirmada" },
  { guest:"Família Duarte", email:"duarte@exemplo.com", roomId:3, checkin:novDate(13), checkout:novDate(16), dailyRate:420, total:1260, origin:"Bairro Papo", status:"Confirmada" },
  { guest:"Família Souza", email:"souza@exemplo.com", roomId:4, checkin:novDate(13), checkout:novDate(15), dailyRate:420, total:840, origin:"Booking", status:"Confirmada" },
  { guest:"João Pedro", email:"joao@exemplo.com", roomId:5, checkin:novDate(17), checkout:novDate(19), dailyRate:210, total:420, origin:"Booking", status:"Confirmada" },
];
function exampleRecords(): Rec<Reservation>[] {
  return EXAMPLE_RESERVATIONS.map((value, i) => ({ id:`exemplo-${value.roomId}-${value.checkin}`, value, created_at:new Date().toISOString(), updated_at:new Date().toISOString() }));
}
function sampleAirbnbICS(roomId:number){
  const t=todayISO();
  const ev=(n:number,a:number,b:number)=>`BEGIN:VEVENT\nUID:exemplo-airbnb-${roomId}-${n}@pmsrefugio\nDTSTART;VALUE=DATE:${addDays(t,a).replaceAll("-","")}\nDTEND;VALUE=DATE:${addDays(t,b).replaceAll("-","")}\nSUMMARY:Airbnb — Hóspede exemplo ${n}\nEND:VEVENT`;
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PMS Refugio//Exemplo Airbnb//PT-BR\n${ev(1,3,5)}\n${ev(2,8,10)}\n${ev(3,12,13)}\nEND:VCALENDAR`;
}
function sampleBookingICS(roomId:number){
  const t=todayISO();
  const ev=(n:number,a:number,b:number)=>`BEGIN:VEVENT\nUID:exemplo-booking-${roomId}-${n}@pmsrefugio\nDTSTART;VALUE=DATE:${addDays(t,a).replaceAll("-","")}\nDTEND;VALUE=DATE:${addDays(t,b).replaceAll("-","")}\nSUMMARY:Booking — Hóspede exemplo ${n}\nEND:VEVENT`;
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PMS Refugio//Exemplo Booking//PT-BR\n${ev(1,5,7)}\n${ev(2,10,12)}\nEND:VCALENDAR`;
}

export default function App(){
  const [reservations,setReservations]=useState<Rec<Reservation>[]>([]);
  const [blocks,setBlocks]=useState<Rec<IcalBlock>[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [backendOk,setBackendOk]=useState(false);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [showSabrina,setShowSabrina]=useState(false);
  const [calendarStart,setCalendarStart]=useState(todayISO());
  const [savingKey,setSavingKey]=useState(crypto.randomUUID());

  // Modal nova reserva
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState({guest:"",email:"",roomId:1,checkin:todayISO(),checkout:addDays(todayISO(),1),dailyRate:320,origin:"Bairro Papo",status:"Confirmada"});
  // Ficha
  const [selectedRes,setSelectedRes]=useState<Rec<Reservation>|null>(null);
  const [selectedBlock,setSelectedBlock]=useState<Rec<IcalBlock>|null>(null);
  // Sincronia direta — cada lado com seu próprio iCal
  const [airbnbRoom,setAirbnbRoom]=useState(1);
  const [bookingRoom,setBookingRoom]=useState(1);
  const [airbnbExportRoom,setAirbnbExportRoom]=useState(1);
  const [bookingExportRoom,setBookingExportRoom]=useState(1);
  const [airbnbLink,setAirbnbLink]=useState("");
  const [bookingLink,setBookingLink]=useState("");
  const [airbnbText,setAirbnbText]=useState("");
  const [bookingText,setBookingText]=useState("");
  const [showPasteAirbnb,setShowPasteAirbnb]=useState(false);
  const [showPasteBooking,setShowPasteBooking]=useState(false);


  const [syncMessage,setSyncMessage]=useState("");
  const [importResult,setImportResult]=useState<{saved:number;remaining:number;error:string|null;reloadError:string|null}|null>(null);

  async function reloadRecords(){
    const [r,b]=await Promise.all([
      api("records.list",{collection:"pms_reservations"}),
      api("records.list",{collection:"pms_ical_blocks"}),
    ]);
    setReservations(r.records||[]);
    setBlocks(b.records||[]);
    return { reservations: (r.records||[]) as Rec<Reservation>[], blocks: (b.records||[]) as Rec<IcalBlock>[] };
  }

  useEffect(()=>{ (async()=>{try{await reloadRecords();setBackendOk(true);}catch(e){setBackendOk(false);setNotice(e instanceof Error?e.message:String(e));}setLoaded(true)})();const changed=()=>{reloadRecords().catch(e=>setNotice(String(e)))};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed)},[]);
  let syncInfo:Record<string,string>={};try{syncInfo=load().sync}catch{}
  const today=todayISO();
  const anchorDate=calendarStart;
  const days = useMemo(()=> Array.from({length:14},(_,i)=>addDays(anchorDate,i)),[anchorDate]);
  const monthKey = today.slice(0,7);

  function isIn(start:string,end:string,day:string){ return day>=start && day<end; }
  function reservationFor(roomId:number,day:string){ return reservations.find(r=>r.value.roomId===roomId && r.value.status!=="Cancelada" && isIn(r.value.checkin,r.value.checkout,day)); }
  function blockFor(roomId:number,day:string){ return blocks.find(b=>b.value.roomId===roomId && isIn(b.value.start,b.value.end,day)); }
  function cleaningFor(roomId:number,day:string){ return reservations.find(r=>r.value.roomId===roomId && r.value.status!=="Cancelada" && r.value.checkout===day && !reservationFor(roomId,day)); }

  const occupiedToday = ROOMS.filter(r=> reservationFor(r.id,today) || blockFor(r.id,today)).length;
  const arrivalsToday = reservations.filter(r=>r.value.checkin===today && r.value.status!=="Cancelada").length;
  const departuresToday = reservations.filter(r=>r.value.checkout===today && r.value.status!=="Cancelada").length;
  const revenueMonth = reservations.filter(r=>r.value.checkin.startsWith(monthKey) && ["Confirmada","Hospedado","Concluída"].includes(r.value.status)).reduce((s,r)=>s+r.value.total,0);
  const airbnbCount = blocks.filter(b=>b.value.origin==="Airbnb (iCal)").length;
  const bookingCount = blocks.filter(b=>b.value.origin==="Booking (iCal)").length;

  function roomStatus(roomId:number){
    if(blockFor(roomId,anchorDate) || reservationFor(roomId,anchorDate)) return "Ocupado";
    if(cleaningFor(roomId,anchorDate)) return "Limpeza";
    return "Livre";
  }
  function statusStyle(s:string){
    if(s==="Ocupado") return {bg:"#3b1a12",color:"#ffb59f",dot:"#ff6b4a",label:"Ocupado"};
    if(s==="Limpeza") return {bg:"#3a2d08",color:"#ffd86b",dot:"#ffb020",label:"Limpeza"};
    if(s==="Manutenção") return {bg:"#2a1a2e",color:"#d8a7ff",dot:"#b26bff",label:"Manutenção"};
    return {bg:"#123a23",color:"#7ee8a6",dot:"#2fbf6b",label:"Livre"};
  }

  function openNew(roomId:number, day:string){
    const room=roomById(roomId);
    setForm({guest:"",email:"",roomId,checkin:day,checkout:addDays(day,1),dailyRate:room?.rate||320,origin:"Bairro Papo",status:"Confirmada"});
    setSavingKey(crypto.randomUUID());
    setShowNew(true);
  }
  function handleCell(roomId:number, day:string){
    const r=reservationFor(roomId,day);
    if(r){ setSelectedRes(r); return; }
    const b=blockFor(roomId,day);
    if(b){ setSelectedBlock(b); return; }
    openNew(roomId,day);
  }

  async function saveReservation(){
    if(!form.guest.trim()){ setNotice("Informe o nome do hóspede antes de salvar."); return; }
    if(form.checkout<=form.checkin){ setNotice("O check-out precisa ser depois do check-in."); return; }
    const clash = reservations.some(r=>r.value.roomId===form.roomId && r.value.status!=="Cancelada" && form.checkin < r.value.checkout && form.checkout > r.value.checkin);
    const clashBlock = blocks.some(b=>b.value.roomId===form.roomId && form.checkin < b.value.end && form.checkout > b.value.start);
    if(clash || clashBlock){ setNotice("Este quarto já está bloqueado neste período. Escolha outro quarto ou outras datas."); return; }
    const value:Reservation={guest:form.guest.trim(),email:form.email.trim(),roomId:form.roomId,checkin:form.checkin,checkout:form.checkout,dailyRate:form.dailyRate,total:nights(form.checkin,form.checkout)*form.dailyRate,origin:form.origin,status:form.status};
    setBusy(true); setNotice("");
    try{
      await api("records.create",{collection:"pms_reservations",value,idempotency_key:savingKey});
      await reloadRecords();
      setShowNew(false);
      setNotice("Reserva salva. As datas já aparecem bloqueadas no calendário.");
    }catch(e){ setNotice(e instanceof Error?e.message:"Não foi possível salvar agora."); }
    setBusy(false);
  }

  async function updateReservationStatus(rec:Rec<Reservation>, status:string){
    setBusy(true);
    try{
      if(rec.id.startsWith("exemplo-")){
        setReservations(prev=>prev.map(p=>p.id===rec.id?{...p,value:{...p.value,status}}:p));
        await api("records.create",{collection:"pms_reservations",value:{...rec.value,status},idempotency_key:`exemplo-${rec.value.roomId}-${rec.value.checkin}`});
        await reloadRecords();
      } else {
        await api("records.replace",{collection:"pms_reservations",id:rec.id,value:{...rec.value,status},expectedUpdatedAt:rec.updated_at});
        await reloadRecords();
      }
      setSelectedRes(null);
      setNotice(status==="Cancelada"?"Reserva cancelada. As datas foram liberadas.":status==="Concluída"?"Check-out registrado. O quarto entra para limpeza.":"Check-in registrado. Bom descanso para o hóspede!");
    }catch(e){ setNotice(e instanceof Error?e.message:"Não foi possível atualizar."); }
    setBusy(false);
  }
  async function deleteBlock(rec:Rec<IcalBlock>){
    setBusy(true);
    try{ await api("records.delete",{collection:"pms_ical_blocks",id:rec.id}); await reloadRecords(); setSelectedBlock(null); setNotice("Bloqueio importado removido."); }
    catch(e){ setNotice("Não foi possível remover o bloqueio agora."); }
    setBusy(false);
  }

  async function importText(text:string, side:"airbnb"|"booking"){
    const roomId=side==="airbnb"?airbnbRoom:bookingRoom,origin=side==="airbnb"?"Airbnb (iCal)":"Booking (iCal)";
    parseCalendar(text);
    const prior=blocks.filter(b=>b.value.roomId===roomId&&b.value.origin===origin).length;
    if(prior&&!confirm(`Esta importação substituirá os ${prior} bloqueios anteriores deste quarto e plataforma. Continuar?`))return false;
    const r=await api('calendar.import',{text,roomId,origin});await reloadRecords();

    setImportResult({saved:r.saved,remaining:0,error:r.conflicts?`${r.conflicts} evento(s) conflitam com reservas locais. Revise antes de vender.`:null,reloadError:null});
    setNotice(`${side==="airbnb"?"Airbnb":"Booking"}: ${r.saved} bloqueios importados neste navegador. Outros canais não foram atualizados.`);return true;
  }
  async function importSide(side:"airbnb"|"booking"){
    const text=side==="airbnb"?airbnbText:bookingText,link=side==="airbnb"?airbnbLink:bookingLink;
    if(text.trim())return importText(text,side);
    if(!link.trim())throw Error('Cole o link privado ou o conteúdo .ics da plataforma.');
    let u:URL;try{u=new URL(link)}catch{throw Error('Informe um link HTTPS válido.')}
    const roots=side==="airbnb"?['airbnb.com','airbnb.com.br']:['booking.com'];
    if(u.protocol!=='https:'||u.username||u.password||u.port||!roots.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)))throw Error('Use um link HTTPS oficial da plataforma selecionada.');
    let r:Response;try{r=await fetch(u.href,{signal:AbortSignal.timeout(15000),credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'})}catch{if(side==='airbnb')setShowPasteAirbnb(true);else setShowPasteBooking(true);throw Error('Não foi possível ler o link (pode ser CORS, rede ou redirecionamento). Nenhum bloqueio foi alterado. Cole o conteúdo .ics como alternativa.');}
    if(!r.ok)throw Error('A plataforma não disponibilizou o calendário. Use a alternativa .ics.');
    if(Number(r.headers.get('content-length'))>1000000)throw Error('Calendário acima de 1 MB.');
    return importText(await r.text(),side);
  }
  async function tryFetchLink(side:"airbnb"|"booking"){if(busy)return;setBusy(true);try{await importSide(side)}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
  async function useSample(){if(busy)return;setBusy(true);try{let added=0;for(const [i,value]of EXAMPLE_RESERVATIONS.entries()){try{await api('records.create',{collection:'pms_reservations',value,idempotency_key:`sample-v1-${i}`});added++}catch(e){setNotice(String(e))}}await reloadRecords();setCalendarStart(todayISO());setNotice(`${added} exemplos carregados ou já existentes. Datas ocupadas por outros registros são preservadas.`)}catch(e){setNotice(String(e))}finally{setBusy(false)}}
  async function readPasted(side:"airbnb"|"booking"){if(busy)return;setBusy(true);try{await importText(side==='airbnb'?airbnbText:bookingText,side)}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
  async function syncNow(){if(busy)return;setBusy(true);let results:string[]=[];for(const side of ['airbnb','booking'] as const){try{const ok=await importSide(side);results.push(`${side==='airbnb'?'Airbnb':'Booking'}: ${ok?'importado':'cancelado'}`)}catch(e){results.push(`${side==='airbnb'?'Airbnb':'Booking'}: ${e instanceof Error?e.message:String(e)}`)}}setSyncMessage(results.join(' | '));setNotice('Consulta concluída. Veja o resultado individual; não há atualização automática das plataformas.');setBusy(false)}
  function exportICS(roomId:number, side?: "airbnb"|"booking"){
    const calendar=makeCalendar(reservations,roomId);
    const blob=new Blob([calendar],{type:"text/calendar"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download= side==="airbnb" ? "pms-refugio-airbnb.ics" : side==="booking" ? "pms-refugio-booking.ics" : `quarto-${roomId}-pms-refugio.ics`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice("Arquivo .ics baixado com as reservas locais do quarto, sem dados do hóspede. Não publica um link assinável nem atualiza Airbnb ou Booking automaticamente.");
  }

  const formNights=nights(form.checkin,form.checkout);
  const formTotal=formNights*form.dailyRate;
  const sortedReservations = [...reservations].sort((a,b)=>a.value.checkin.localeCompare(b.value.checkin) || a.value.roomId-b.value.roomId);

  return (
    <div data-safe-area-inset-root style={{boxSizing:"border-box",paddingTop:"var(--safe-area-inset-top, 0px)",minHeight:"100vh",background:"var(--bg)"}} className="overflow-x-clip">
      <div className="test-banner">TESTE · Quartos, categorias e tarifas de exemplo · Salvo só neste navegador · Sem conexão com a Sabrina ou pagamentos</div>
      <header data-safe-area-sticky-top style={{top:"var(--safe-area-inset-top, 0px)"}} className="sticky z-30 border-b border-[var(--line)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap"><span className="text-[11px] font-bold tracking-[0.18em] text-[#7ee8a6]">BAIRRO PAPO • POUSADA</span><span className="badge bg-[#123a23] text-[#7ee8a6]">Versão iCal</span><span className="badge bg-[#2fbf6b] text-[#07120c]">Teste independente</span></div>
            <h1 className="text-[clamp(24px,4vw,38px)] leading-[1.05] font-extrabold tracking-tight mt-1">PMS Refúgio <span className="text-[#2fbf6b]">— Bairro Papo</span></h1>
            <p className="text-[var(--muted)] text-[13px] sm:text-sm mt-1 max-w-[680px]">Sincronia direta, sem Channel Manager no meio. Importe calendários de datas e exporte arquivos iCal. Tarifas são cadastradas no PMS; não vêm dos canais.</p>
          </div>
          <button onClick={()=>setShowSabrina(v=>!v)} className="btn-primary flex items-center gap-2 shrink-0"><MessageCircle size={18}/> Integração com Sabrina</button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 sm:px-6 pb-16">
        {showSabrina && (
          <section className="card mt-5 p-5 sm:p-6 border-[#2fbf6b]">
            <div className="flex gap-3"><Sparkles className="text-[#2fbf6b] shrink-0" size={24}/><div>
              <h2 className="font-bold text-lg">Como a Sabrina usa este PMS</h2>
              <p className="text-[var(--muted)] text-sm mt-1 leading-relaxed">Próxima etapa: Sabrina consulta disponibilidade e tarifas deste PMS antes de preparar uma solicitação. A integração com o Bairro Papo ainda não está conectada.</p>
              <p className="text-sm mt-3 bg-[#0a1a11] border border-[var(--line)] rounded-xl p-3">Neste teste, somente você registra reservas. Um calendário iCal pode estar desatualizado; não autoriza confirmação automática pela Sabrina.</p>
            </div></div>
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-[#ffb020] bg-[#2a2008] p-4 sm:p-5 flex gap-3">
          <ShieldAlert className="text-[#ffb020] shrink-0" size={28}/>
          <div><p className="font-bold">Versão iCal direta Airbnb + Booking: sincroniza SÓ as datas, não sincroniza preço. Sem Channel Manager no meio. Sem intermediário.</p><p className="text-sm text-[#f3dfae] mt-1 leading-relaxed">A atualização pode demorar alguns minutos/horas no Airbnb e Booking. Consulte também os canais originais antes de confirmar: iCal não elimina risco de reserva duplicada.</p></div>
        </section>

        {loaded && !backendOk && <p className="mt-4 text-sm bg-[#3b1a12] border border-[#ff6b4a] rounded-xl p-3">Armazenamento local indisponível. Nenhum salvamento está confirmado.</p>}
        {notice && <div className="mt-4 flex gap-2 items-start bg-[#123a23] border border-[#2fbf6b] rounded-xl p-3 text-sm"><CheckCircle2 size={18} className="shrink-0 text-[#2fbf6b]"/><span>{notice}</span><button aria-label="Fechar aviso" onClick={()=>setNotice("")} className="ml-auto"><X size={16}/></button></div>}

        {/* Dashboard */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {[
            {icon:<BedDouble size={20}/>,label:"Ocupação de hoje",value:`${occupiedToday} / 6`,sub:`${Math.round(occupiedToday/6*100)}% dos quartos`},
            {icon:<LogIn size={20}/>,label:"Chegadas hoje",value:String(arrivalsToday),sub:"check-in previsto"},
            {icon:<LogOut size={20}/>,label:"Saídas hoje",value:String(departuresToday),sub:"quartos para limpeza"},
            {icon:<Wallet size={20}/>,label:"Valor reservado no mês",value:money(revenueMonth),sub:"não comprova pagamentos"},
          ].map((c,i)=>(
            <div key={i} className="card p-4 sm:p-5"><div className="text-[#7ee8a6]">{c.icon}</div><p className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-bold mt-3">{c.label}</p><p className="text-[clamp(22px,3vw,32px)] font-extrabold leading-tight">{c.value}</p><p className="text-xs text-[var(--muted)]">{c.sub}</p></div>
          ))}
        </section>

        {/* SINCRONIA DIRETA NAS DUAS */}
        <section className="mt-6" aria-label="Sincronia direta nas duas">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-[#7ee8a6] font-bold">SEM CHANNEL MANAGER NO MEIO</p>
              <h2 className="text-[clamp(22px,3.5vw,32px)] font-extrabold leading-tight">AIRBNB ↔ PMS REFÚGIO ↔ BOOKING</h2>
              <p className="text-sm text-[var(--muted)] mt-1 max-w-[760px]">Airbnb <span aria-hidden="true">↔</span> PMS Refúgio <span aria-hidden="true">↔</span> Booking. Cada lado tem seu próprio link iCal, sua própria importação e sua própria exportação.</p>
            </div>
            <span className="badge bg-[#123a23] text-[#7ee8a6]"><ArrowLeftRight size={14}/> Direto • iCal • Sem intermediário</span>
          </div>

          <div className="grid gap-4 mt-4 lg:grid-cols-3 items-stretch">
            {/* AIRBNB */}
            <article className="card p-5 sm:p-6 flex flex-col border-[#ff5a5f]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-xl tracking-tight"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#ff5a5f] text-white text-sm font-extrabold mr-2">A</span>AIRBNB</h3>
                <span className="badge bg-[#3a1214] text-[#ffb3b6]">Lado 1</span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2">Importa as datas vendidas no Airbnb e trava o quarto aqui — direto, sem Channel Manager.</p>

              <div className="mt-4 bg-[#0a1a11] border border-[var(--line)] rounded-xl p-4">
                <p className="text-[11px] tracking-[0.14em] font-bold text-[#ffb3b6]">AJUDA PARA EXPORTAR O CALENDÁRIO</p>
                <a href={CALENDAR_HELP_URL} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 font-bold text-white underline underline-offset-2 decoration-[#ff5a5f] hover:text-[#ffd1d3]">Como exportar o calendário do Airbnb <ExternalLink size={15} className="shrink-0" /></a>
                <p className="text-xs text-[var(--muted)] mt-1">Abre a ajuda do Airbnb sobre calendários externos.</p>
              </div>

              <div className="mt-4 bg-[#0a1a11] border border-[#ff5a5f] rounded-xl p-4">
                <h4 className="font-extrabold">Como pegar o link iCal no Airbnb</h4>
                <ol className="list-decimal pl-5 mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
                  <li><span className="text-white">Abrir o Calendário.</span></li>
                  <li><span className="text-white">Abrir Configurações de disponibilidade.</span></li>
                  <li><span className="text-white">Tocar em Exportar calendário.</span></li>
                  <li><span className="text-white">Tocar em Copiar link.</span></li>
                </ol>
                <p className="text-sm mt-3 leading-relaxed"><span className="font-bold">Resumo:</span> <span className="text-[var(--muted)]">Calendário &gt; Configurações de disponibilidade &gt; Exportar calendário &gt; Copiar link.</span></p>

                <div className="mt-4 border-t border-[var(--line)] pt-3">
                  <p className="font-bold text-sm">Alternativa manual</p>
                  <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">Se o sistema externo não suportar assinatura por URL, baixe o arquivo do calendário e cole o conteúdo .ics no campo abaixo — sem precisar de link.</p>
                </div>
              </div>

              <label className="block mt-4"><span className="field-label">Quarto (importação Airbnb)</span><select value={airbnbRoom} onChange={e=>setAirbnbRoom(Number(e.target.value))}>{ROOMS.map(r=><option key={r.id} value={r.id}>{r.name} — {r.type}</option>)}</select></label>
              <label className="block mt-3"><span className="field-label">Link iCal do Airbnb</span><input value={airbnbLink} onChange={e=>setAirbnbLink(e.target.value)} placeholder="Cole seu link privado do Airbnb" inputMode="url"/></label>
              <button className="btn-primary w-full mt-3" onClick={()=>tryFetchLink("airbnb")} disabled={busy}>{busy?"Tentando ler…":"Importar do Airbnb"}</button>
              <button className="btn-ghost w-full mt-2" onClick={()=>setShowPasteAirbnb(v=>!v)}>{showPasteAirbnb?"Esconder campo .ics":"Colar conteúdo .ics"}</button>
              {showPasteAirbnb && <div className="mt-3"><label><span className="field-label">Ou cole aqui o conteúdo do arquivo .ics</span><textarea rows={5} value={airbnbText} onChange={e=>setAirbnbText(e.target.value)} placeholder={"BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20260210\nDTEND;VALUE=DATE:20260212\nSUMMARY:Airbnb — Hóspede\nEND:VEVENT\nEND:VCALENDAR"} className="mono text-[13px]"/></label><button className="btn-primary mt-2 w-full" onClick={()=>readPasted("airbnb")} disabled={busy}>Ler datas do Airbnb</button></div>}
              <div className="border-t border-[var(--line)] mt-4 pt-4">
                <label className="block"><span className="field-label">Quarto para exportar para o Airbnb</span><select value={airbnbExportRoom} onChange={e=>setAirbnbExportRoom(Number(e.target.value))}>{ROOMS.map(r=><option key={r.id} value={r.id}>{r.name} — {r.type}</option>)}</select></label>
                <button className="btn-dark w-full mt-3 flex items-center justify-center gap-2" onClick={()=>exportICS(airbnbExportRoom,"airbnb")}><Download size={16}/> Exportar para o Airbnb</button>
                <p className="text-xs text-[var(--muted)] mt-2">Gera pms-refugio-airbnb.ics só com as reservas daquele quarto.</p>
              </div>
              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                <span className="badge bg-[#0a1a11] border border-[var(--line)] text-white"><Clock3 size={14}/> Última importação: {(syncInfo["Airbnb (iCal)|"+airbnbRoom]?new Date(syncInfo["Airbnb (iCal)|"+airbnbRoom]).toLocaleString("pt-BR"):"--")}</span>
                <span className="badge bg-[#3a1214] text-[#ffb3b6]">{airbnbCount} bloqueio(s) do Airbnb</span>
              </div>
            </article>

            {/* PMS CENTRO */}
            <article className="card p-5 sm:p-6 flex flex-col border-[#2fbf6b] bg-[#0f1e15]">
              <div className="text-center">
                <span className="badge bg-[#2fbf6b] text-[#07120c]">CENTRO</span>
                <h3 className="font-extrabold text-[clamp(20px,3vw,26px)] leading-tight mt-3">PMS REFÚGIO</h3>
                <p className="text-sm mt-3 leading-relaxed">Os bloqueios importados aparecem neste PMS. As plataformas externas não são atualizadas automaticamente por este teste.</p>
              </div>
              <div className="bg-[#0a1a11] border border-[var(--line)] rounded-xl p-4 mt-4 text-sm leading-relaxed">
                <p className="flex gap-2"><span className="font-bold text-[#ffb3b6]">Airbnb →</span><span>PMS trava a data</span></p>
                <p className="flex gap-2 mt-2"><span className="font-bold text-[#54b7ff]">Booking →</span><span>PMS trava a data</span></p>
                <p className="flex gap-2 mt-2"><span className="font-bold text-[#7ee8a6]">PMS →</span><span>baixa arquivos iCal por quarto</span></p>
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-extrabold">{airbnbCount} <span className="text-sm font-medium text-[var(--muted)]">Airbnb</span> <span className="text-[var(--muted)]">+</span> {bookingCount} <span className="text-sm font-medium text-[var(--muted)]">Booking</span></p>
                <p className="text-xs text-[var(--muted)]">bloqueios já aplicados no calendário</p>
              </div>
              <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2" onClick={syncNow} disabled={busy}><RefreshCw size={17}/> Sincronizar as duas agora</button>
              <button className="btn-dark w-full mt-2" onClick={useSample} disabled={busy}>Usar exemplo</button>
              <p className="text-xs text-[var(--muted)] text-center mt-2">Exemplo: 5 reservas — Marina e Rafael (Airbnb), Lucas Almeida (Airbnb), Família Duarte (Bairro Papo), Família Souza (Booking) e João Pedro (Booking).</p>
              {syncMessage && <p className="mt-3 bg-[#123a23] border border-[#2fbf6b] rounded-xl p-3 text-sm text-center font-semibold">{syncMessage}</p>}
              {importResult && <div className="mt-3 bg-[#0a1a11] border border-[var(--line)] rounded-xl p-3 text-sm"><b>Importação:</b> {importResult.saved} salvos • {importResult.remaining} restantes{importResult.error?<div className="text-[#ffb59f] mt-1">{importResult.error}</div>:null}{importResult.reloadError?<div className="text-[#ffb59f]">Falha ao recarregar: {importResult.reloadError}</div>:null}</div>}
            </article>

            {/* BOOKING */}
            <article className="card p-5 sm:p-6 flex flex-col border-[#54b7ff]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-xl tracking-tight"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#003580] text-white text-sm font-extrabold mr-2">B</span>BOOKING</h3>
                <span className="badge bg-[#12233a] text-[#a8d4ff]">Lado 2</span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2">Importa as datas vendidas no Booking e trava o quarto aqui — direto, sem Channel Manager.</p>
              <div className="mt-4 bg-[#0a1a11] border border-[#54b7ff] rounded-xl p-4">
                <h4 className="font-extrabold">Como pegar o link iCal no Booking</h4>
                <ol className="list-decimal pl-5 mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
                  <li><span className="text-white">Entrar na Extranet.</span></li>
                  <li><span className="text-white">Abrir o Calendário.</span></li>
                  <li><span className="text-white">Abrir Sincronizar calendários.</span></li>
                  <li><span className="text-white">Tocar em Exportar / Copiar URL.</span></li>
                </ol>
                <p className="text-sm mt-3 leading-relaxed"><span className="font-bold">Resumo:</span> <span className="text-[var(--muted)]">Extranet &gt; Calendário &gt; Sincronizar calendários &gt; Exportar / Copiar URL.</span></p>
                <div className="mt-4 border-t border-[var(--line)] pt-3">
                  <p className="font-bold text-sm">Alternativa manual</p>
                  <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">Se o sistema externo não suportar assinatura por URL, baixe o arquivo do calendário e cole o conteúdo .ics no campo abaixo — sem precisar de link.</p>
                </div>
              </div>
              <label className="block mt-4"><span className="field-label">Quarto (importação Booking)</span><select value={bookingRoom} onChange={e=>setBookingRoom(Number(e.target.value))}>{ROOMS.map(r=><option key={r.id} value={r.id}>{r.name} — {r.type}</option>)}</select></label>
              <label className="block mt-3"><span className="field-label">Link iCal do Booking</span><input value={bookingLink} onChange={e=>setBookingLink(e.target.value)} placeholder="Cole seu link privado da Booking" inputMode="url"/></label>
              <button className="btn-primary w-full mt-3" onClick={()=>tryFetchLink("booking")} disabled={busy}>{busy?"Tentando ler…":"Importar do Booking"}</button>
              <button className="btn-ghost w-full mt-2" onClick={()=>setShowPasteBooking(v=>!v)}>{showPasteBooking?"Esconder campo .ics":"Colar conteúdo .ics"}</button>
              {showPasteBooking && <div className="mt-3"><label><span className="field-label">Ou cole aqui o conteúdo do arquivo .ics</span><textarea rows={5} value={bookingText} onChange={e=>setBookingText(e.target.value)} placeholder={"BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20260210\nDTEND;VALUE=DATE:20260212\nSUMMARY:Booking — Hóspede\nEND:VEVENT\nEND:VCALENDAR"} className="mono text-[13px]"/></label><button className="btn-primary mt-2 w-full" onClick={()=>readPasted("booking")} disabled={busy}>Ler datas do Booking</button></div>}
              <div className="border-t border-[var(--line)] mt-4 pt-4">
                <label className="block"><span className="field-label">Quarto para exportar para o Booking</span><select value={bookingExportRoom} onChange={e=>setBookingExportRoom(Number(e.target.value))}>{ROOMS.map(r=><option key={r.id} value={r.id}>{r.name} — {r.type}</option>)}</select></label>
                <button className="btn-dark w-full mt-3 flex items-center justify-center gap-2" onClick={()=>exportICS(bookingExportRoom,"booking")}><Download size={16}/> Exportar para o Booking</button>
                <p className="text-xs text-[var(--muted)] mt-2">Gera pms-refugio-booking.ics só com as reservas daquele quarto.</p>
              </div>
              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                <span className="badge bg-[#0a1a11] border border-[var(--line)] text-white"><Clock3 size={14}/> Última importação: {(syncInfo["Booking (iCal)|"+bookingRoom]?new Date(syncInfo["Booking (iCal)|"+bookingRoom]).toLocaleString("pt-BR"):"--")}</span>
                <span className="badge bg-[#12233a] text-[#a8d4ff]">{bookingCount} bloqueio(s) do Booking</span>
              </div>
            </article>
          </div>
          <p className="text-xs text-[var(--muted)] mt-3 flex items-start gap-2"><Link2 size={14} className="shrink-0 mt-0.5"/> O PMS lê os eventos VEVENT (DTSTART, DTEND e SUMMARY) de cada link e cria bloqueios com a origem correta. Cada lado é independente: importar do Airbnb não mistura com o Booking.</p>
        </section>

        {/* Quartos */}
        <div className="flex items-end justify-between mt-8 gap-3 flex-wrap"><div><p className="text-[11px] tracking-[0.18em] text-[#7ee8a6] font-bold">SEUS QUARTOS</p><h2 className="text-2xl font-extrabold">Lista de quartos</h2></div><button onClick={()=>openNew(1,anchorDate)} disabled={!loaded || !backendOk || busy} className="btn-primary flex items-center gap-2"><Plus size={18}/> Nova reserva</button></div>
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {ROOMS.map(room=>{
            const st=roomStatus(room.id); const s=statusStyle(st);
            const next=reservations.filter(r=>r.value.roomId===room.id && r.value.status!=="Cancelada" && r.value.checkin>=anchorDate).sort((a,b)=>a.value.checkin.localeCompare(b.value.checkin))[0];
            const nextBlock=blocks.filter(b=>b.value.roomId===room.id && b.value.end>anchorDate).sort((a,b)=>a.value.start.localeCompare(b.value.start))[0];
            return <article key={room.id} className="card p-5">
              <div className="flex justify-between gap-2"><div><h3 className="font-bold text-lg">{room.name} <span className="text-[var(--muted)] font-medium">• {room.type}</span></h3><p className="text-sm text-[var(--muted)] flex items-center gap-1"><Users size={14}/> Até {room.capacity} hóspedes • {money(room.rate)}/noite (exemplo)</p></div><span className="badge" style={{background:s.bg,color:s.color}}><span className="dot" style={{background:s.dot}}/>{s.label}</span></div>
              <p className="text-sm mt-4 min-h-[40px] text-[var(--muted)]">{next?<>Próxima: <b className="text-white">{next.value.guest}</b> — {fmtDate(next.value.checkin)} a {fmtDate(next.value.checkout)}</>:nextBlock?<>Bloqueio iCal: <b className="text-white">{nextBlock.value.summary}</b> — {fmtDate(nextBlock.value.start)}</>:<>Sem reserva nos próximos dias.</>}</p>
              <div className="flex gap-2 mt-4"><button className="btn-dark flex-1" onClick={()=>openNew(room.id,anchorDate)}>Reservar</button><button className="btn-ghost flex items-center gap-1" onClick={()=>exportICS(room.id)}><Download size={15}/> iCal</button></div>
            </article>;
          })}
        </section>

        <p className="mt-6 text-sm font-semibold text-[#7ee8a6]">Mostrando {reservations.length} reservas neste navegador</p>

        {/* Calendário */}
        <section className="card mt-3 p-4 sm:p-5">
          <div className="flex flex-wrap justify-between gap-3 items-center"><div><h2 className="text-xl font-extrabold flex items-center gap-2"><CalendarDays className="text-[#2fbf6b]"/> Calendário de reservas</h2><div className="flex items-center gap-2 flex-wrap my-3"><button className="btn-ghost" onClick={()=>setCalendarStart(addDays(anchorDate,-14))}>← 14 dias</button><input aria-label="Início do calendário" type="date" value={calendarStart} onChange={e=>{if(e.target.value)setCalendarStart(e.target.value)}} className="!w-auto"/><button className="btn-ghost" onClick={()=>setCalendarStart(todayISO())}>Hoje</button><button className="btn-ghost" onClick={()=>setCalendarStart(addDays(anchorDate,14))}>14 dias →</button></div><p className="text-sm text-[var(--muted)]">Próximos 14 dias a partir de {fmtFull(anchorDate)} • clique num dia livre para criar reserva, ou num dia ocupado para ver a ficha.</p></div><div className="flex flex-wrap gap-3 text-xs"><span><i className="legend-dot bg-[#ff6b4a]"/> Ocupado</span><span><i className="legend-dot bg-[#2fbf6b]"/> Livre</span><span><i className="legend-dot bg-[#ffb020]"/> Limpeza</span></div></div>
          <div className="overflow-x-auto mt-4 pb-1 -mx-1 px-1">
            <div style={{minWidth:760}}>
              <div className="grid gap-2" style={{gridTemplateColumns:`150px repeat(14,minmax(64px,1fr))`}}>
                <div className="text-xs font-bold text-[var(--muted)] uppercase pt-4">Quarto</div>
                {days.map(d=><div key={d} className="text-center"><div className="text-xs text-[var(--muted)]">{parseBR(d).toLocaleDateString("pt-BR",{weekday:"short"})}</div><div className="font-bold text-sm">{parseBR(d).getDate()}</div><div className="text-[11px] text-[var(--muted)]">{parseBR(d).toLocaleDateString("pt-BR",{month:"short"})}</div></div>)}
              </div>
              {ROOMS.map(room=>(
                <div key={room.id} className="grid gap-2 mt-2 items-center" style={{gridTemplateColumns:`150px repeat(14,minmax(64px,1fr))`}}>
                  <div className="pr-2"><p className="font-bold text-sm leading-tight">{room.name}</p><p className="text-[11px] text-[var(--muted)]">{room.type}</p></div>
                  {days.map(day=>{
                    const r=reservationFor(room.id,day); const b=blockFor(room.id,day); const cl=cleaningFor(room.id,day);
                    const bg=r||b?"#5b2318":cl?"#4a3608":"#143f28"; const color=r||b?"#ffd5c9":cl?"#ffe08a":"#a9f0c5";
                    return <button key={day} onClick={()=>handleCell(room.id,day)} className="cal-cell" style={{background:bg,color}} aria-label={`${room.name} ${fmtFull(day)} ${r?"ocupado":b?"bloqueio iCal":cl?"limpeza":"livre"}`}>
                      <span className="text-[11px] font-bold leading-none">{r?r.value.guest.split(" ")[0]:b?"iCal":cl?"Limpeza":"Livre"}</span>
                      <span className="text-[10px] opacity-80 leading-none">{r?r.value.origin:b?b.value.origin:cl?"saiu hoje":""}</span>
                    </button>;
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lista de reservas — logo abaixo do calendário, sempre visível */}
        <section className="mt-6" aria-label="Lista de reservas">
          <h2 className="text-xl font-extrabold">Reservas salvas</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Mostrando {reservations.length} reservas neste navegador • clique numa reserva para abrir a ficha.</p>
          {sortedReservations.length===0 ? (
            <p className="text-sm text-[var(--muted)] mt-4 card p-5">Nenhuma reserva salva ainda. Use “Usar exemplo” para carregar as 5 reservas de exemplo.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {sortedReservations.map(r=>(
                <button key={r.id} onClick={()=>setSelectedRes(r)} className="card p-4 text-left">
                  <p className="font-bold">{r.value.guest}</p>
                  <p className="text-sm text-[var(--muted)]">{roomById(r.value.roomId)?.name} • {fmtDate(r.value.checkin)} a {fmtDate(r.value.checkout)} • {money(r.value.total)}</p>
                  <p className="text-xs mt-2"><span className="badge bg-[#123a23] text-[#7ee8a6]">{r.value.origin}</span> <span className="badge bg-[#1a3325] text-white">{r.value.status}</span></p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Bloqueios */}
        <section className="card mt-6 p-5 sm:p-6">
          <div className="flex justify-between flex-wrap gap-2"><div><h2 className="text-xl font-extrabold">Bloqueios importados via iCal</h2><p className="text-sm text-[var(--muted)]">{blocks.length} bloqueio(s) salvos no app. • {airbnbCount} do Airbnb • {bookingCount} do Booking</p></div><span className="badge bg-[#123a23] text-[#7ee8a6]"><Eye size={14}/> Sincronia por datas</span></div>
          {blocks.length===0?<p className="text-sm text-[var(--muted)] mt-4">Nenhum bloqueio importado ainda. Clique em “Usar exemplo” acima para ver as 5 reservas de exemplo no calendário e na lista.</p>:
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">{blocks.map(b=><article key={b.id} className="bg-[#0a1a11] border border-[var(--line)] rounded-xl p-4"><p className="font-bold">{roomById(b.value.roomId)?.name} • {b.value.origin}</p><p className="text-sm text-[var(--muted)] mt-1">{fmtFull(b.value.start)} → {fmtFull(b.value.end)}</p><p className="text-sm mt-2">{b.value.summary}</p><button className="mt-3 text-sm text-[#ffb59f] flex items-center gap-1" onClick={()=>{if(confirm("Remover este bloqueio somente deste navegador? A plataforma externa não será alterada."))deleteBlock(b)}}><Trash2 size={14}/> Remover bloqueio</button></article>)}</div>}
        </section>

        <footer className="text-center text-xs text-[var(--muted)] mt-10">PMS Refúgio — demonstração com sincronia por iCal. Use dados fictícios. Não confirma reservas nos canais. Dados salvos somente neste navegador.</footer>
      </main>

      {/* Modal nova reserva */}
      {showNew && <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Nova reserva">
        <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-[620px] max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 sm:p-6">
          <div className="flex justify-between"><h2 className="text-2xl font-extrabold">Nova reserva</h2><button aria-label="Fechar" onClick={()=>setShowNew(false)}><X/></button></div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <label><span className="field-label">Hóspede</span><input value={form.guest} onChange={e=>setForm({...form,guest:e.target.value})} placeholder="Nome completo"/></label>
            <label><span className="field-label">E-mail</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="hospede@exemplo.com"/></label>
            <label><span className="field-label">Quarto</span><select value={form.roomId} onChange={e=>{const id=Number(e.target.value); setForm({...form,roomId:id,dailyRate:roomById(id)?.rate||320});}}>{ROOMS.map(r=><option key={r.id} value={r.id}>{r.name} — {r.type}</option>)}</select></label>
            <label><span className="field-label">Origem</span><select value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})}>{ORIGINS.map(o=><option key={o}>{o}</option>)}</select></label>
            <label><span className="field-label">Check-in</span><input type="date" value={form.checkin} onChange={e=>setForm({...form,checkin:e.target.value})}/></label>
            <label><span className="field-label">Check-out</span><input type="date" value={form.checkout} onChange={e=>setForm({...form,checkout:e.target.value})}/></label>
            <label><span className="field-label">Valor da diária</span><input type="number" min={0} value={form.dailyRate} onChange={e=>setForm({...form,dailyRate:Number(e.target.value)})}/></label>
            <label><span className="field-label">Status</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Confirmada</option><option>Pendente</option><option>Cancelada</option></select></label>
          </div>
          <div className="bg-[#0a1a11] border border-[var(--line)] rounded-xl p-4 mt-4 flex justify-between"><span>{formNights} noite(s) × {money(form.dailyRate)}</span><b className="text-xl">Total {money(formTotal)}</b></div>
          <div className="flex gap-2 mt-5"><button className="btn-primary flex-1" onClick={saveReservation} disabled={busy}>{busy?"Salvando…":"Salvar reserva"}</button><button className="btn-ghost" onClick={()=>setShowNew(false)}>Cancelar</button></div>
        </div>
      </div>}

      {/* Ficha reserva */}
      {selectedRes && <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Ficha do hóspede">
        <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-[520px] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"><div className="flex justify-between"><h2 className="text-2xl font-extrabold">Ficha do hóspede</h2><button aria-label="Fechar" onClick={()=>setSelectedRes(null)}><X/></button></div>
          <p className="text-lg font-bold mt-4">{selectedRes.value.guest}</p><p className="text-[var(--muted)] text-sm">{selectedRes.value.email||"E-mail não informado"}</p>
          <dl className="grid grid-cols-2 gap-3 mt-4 text-sm"><div className="bg-[#0a1a11] rounded-xl p-3"><dt className="text-[var(--muted)]">Quarto</dt><dd className="font-bold">{roomById(selectedRes.value.roomId)?.name} — {roomById(selectedRes.value.roomId)?.type}</dd></div><div className="bg-[#0a1a11] rounded-xl p-3"><dt className="text-[var(--muted)]">Origem</dt><dd className="font-bold">{selectedRes.value.origin}</dd></div><div className="bg-[#0a1a11] rounded-xl p-3"><dt className="text-[var(--muted)]">Check-in</dt><dd className="font-bold">{fmtFull(selectedRes.value.checkin)}</dd></div><div className="bg-[#0a1a11] rounded-xl p-3"><dt className="text-[var(--muted)]">Check-out</dt><dd className="font-bold">{fmtFull(selectedRes.value.checkout)}</dd></div><div className="bg-[#0a1a11] rounded-xl p-3"><dt className="text-[var(--muted)]">Valor</dt><dd className="font-bold">{money(selectedRes.value.total)} • {money(selectedRes.value.dailyRate)}/noite</dd></div><div className="bg-[#0a1a11] rounded-xl p-3"><dt className="text-[var(--muted)]">Status</dt><dd className="font-bold">{selectedRes.value.status}</dd></div></dl>
          <div className="grid grid-cols-3 gap-2 mt-5"><button className="btn-primary" onClick={()=>updateReservationStatus(selectedRes,"Hospedado")} disabled={busy}>Check-in</button><button className="btn-dark" onClick={()=>updateReservationStatus(selectedRes,"Concluída")} disabled={busy}>Check-out</button><button className="btn-ghost text-[#ffb59f] border-[#ff6b4a]" onClick={()=>updateReservationStatus(selectedRes,"Cancelada")} disabled={busy}>Cancelar</button></div>
        </div></div>}

      {/* Ficha bloqueio */}
      {selectedBlock && <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Bloqueio iCal">
        <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-[520px] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"><div className="flex justify-between"><h2 className="text-2xl font-extrabold">Bloqueio via iCal</h2><button aria-label="Fechar" onClick={()=>setSelectedBlock(null)}><X/></button></div>
          <p className="font-bold mt-4">{selectedBlock.value.summary}</p><p className="text-[var(--muted)] text-sm mt-1">{roomById(selectedBlock.value.roomId)?.name} • {selectedBlock.value.origin}</p><p className="text-sm mt-3">{fmtFull(selectedBlock.value.start)} até {fmtFull(selectedBlock.value.end)}</p><p className="text-sm text-[var(--muted)] mt-2">Este bloqueio veio de fora do PMS. Para liberar, remova o evento no Airbnb/Booking e depois remova aqui.</p>
          <button className="btn-ghost mt-5 w-full" onClick={()=>{if(confirm("Remover este bloqueio local? Isso não cancela a reserva na plataforma."))deleteBlock(selectedBlock)}} disabled={busy}>Remover bloqueio</button>
        </div></div>}
    </div>
  );
}
