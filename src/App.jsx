import {useEffect,useState} from 'react'
import {supabase} from './supabase'

const AMEN=['WiFi','Meals','AC','Laundry','Attached bath','Power backup']
const go=h=>{location.hash=h}
function useHash(){const[h,s]=useState(location.hash.slice(1)||'/');useEffect(()=>{const f=()=>{s(location.hash.slice(1)||'/');scrollTo(0,0)};addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);return h}
const inr=n=>'₹'+Number(n).toLocaleString('en-IN')

function Card({l}){return <a className="card" href={`#/listing/${l.id}`}><span className={'tag '+l.type}>{l.type}</span><h3>{l.title}</h3>
<div className="mut">{l.area}, {l.distance_km} km from campus</div><div className="chips">{(l.amenities||[]).slice(0,4).map(a=><i key={a}>{a}</i>)}</div><div className="rent">{inr(l.rent)}<small> / month</small></div></a>}

function Home(){const[q,setQ]=useState('');const[top,setTop]=useState([])
useEffect(()=>{supabase.from('listings').select('*').order('created_at',{ascending:false}).limit(3).then(({data})=>setTop(data||[]))},[])
return <>
<section className="hero"><div><h1>Your first week in a new city, sorted.</h1><p>Find an affordable PG, flat or hostel near your college, and the mess that feeds you, all in one place.</p>
<form className="search" onSubmit={e=>{e.preventDefault();go('/listings?q='+encodeURIComponent(q))}}><input aria-label="Search area or name" placeholder="Search area, e.g. Karve Nagar" value={q} onChange={e=>setQ(e.target.value)}/><button>Search homes</button></form></div></section>
<main className="wrap"><h2>How Homey works</h2><div className="steps"><div><h3>Search</h3>Filter by rent, type and distance from campus.</div><div><h3>Check the food</h3>See messes and canteens near each place.</div><div><h3>Ask the owner</h3>Send an enquiry straight to the PG owner.</div></div>
<h2 style={{marginTop:40}}>Newly listed</h2>{top.length?<div className="grid">{top.map(l=><Card key={l.id} l={l}/>)}</div>:<p className="mut">No listings yet. Owners can add the first one after signing up.</p>}</main></>}

function Listings({params}){const[all,setAll]=useState(null);const[f,setF]=useState({q:params.get('q')||'',type:'',max:'',gender:''})
useEffect(()=>{supabase.from('listings').select('*').order('rent').then(({data})=>setAll(data||[]))},[])
const set=k=>e=>setF({...f,[k]:e.target.value})
const shown=(all||[]).filter(l=>(!f.q||(l.title+' '+l.area).toLowerCase().includes(f.q.toLowerCase()))&&(!f.type||l.type===f.type)&&(!f.max||l.rent<=+f.max)&&(!f.gender||l.gender==='Any'||l.gender===f.gender))
return <main className="wrap"><h2>Find your place</h2>
<div className="filters"><input aria-label="Area or name" placeholder="Area or name" value={f.q} onChange={set('q')}/>
<select aria-label="Type" value={f.type} onChange={set('type')}><option value="">All types</option><option>PG</option><option>Flat</option><option>Hostel</option></select>
<select aria-label="Max rent" value={f.max} onChange={set('max')}><option value="">Any rent</option>{[5000,7000,10000,15000].map(n=><option key={n} value={n}>Up to {inr(n)}</option>)}</select>
<select aria-label="Gender" value={f.gender} onChange={set('gender')}><option value="">Any gender</option><option>Boys</option><option>Girls</option></select></div>
{all===null?<p>Loading…</p>:shown.length?<div className="grid">{shown.map(l=><Card key={l.id} l={l}/>)}</div>:<p className="mut">Nothing matches these filters. Try a higher rent or clear the area.</p>}</main>}

function Detail({id,user}){const[l,setL]=useState(null);const[m,setM]=useState([]);const[msg,setMsg]=useState('');const[note,setNote]=useState('');const[saved,setSaved]=useState(false)
useEffect(()=>{supabase.from('listings').select('*').eq('id',id).single().then(({data})=>{setL(data);if(data)supabase.from('messes').select('*').eq('area',data.area).then(r=>setM(r.data||[]))})
if(user)supabase.from('saved').select('listing_id').eq('listing_id',id).eq('user_id',user.id).then(({data})=>setSaved(!!data?.length))},[id,user])
const send=async e=>{e.preventDefault();if(!user)return go('/login');const{error}=await supabase.from('enquiries').insert({listing_id:id,user_id:user.id,message:msg});setNote(error?error.message:'Enquiry sent. The owner will see it on their dashboard.');if(!error)setMsg('')}
const save=async()=>{if(!user)return go('/login');if(saved)await supabase.from('saved').delete().eq('listing_id',id).eq('user_id',user.id);else await supabase.from('saved').insert({listing_id:id,user_id:user.id});setSaved(!saved)}
if(!l)return <main className="wrap">Loading…</main>
return <main className="wrap"><a href="#/listings">‹ All listings</a><div className="two" style={{marginTop:14}}><div>
<div className="panel"><span className={'tag '+l.type}>{l.type}</span><h2 style={{marginTop:10}}>{l.title}</h2><div className="mut">{l.area}, {l.distance_km} km from campus, for {l.gender}</div>
<p>{l.description}</p><div className="chips">{(l.amenities||[]).map(a=><i key={a}>{a}</i>)}</div><div className="rent">{inr(l.rent)}<small> / month</small></div>
<p>Contact: <b>{l.contact||'Use the enquiry form'}</b> ({l.owner_name})</p><button className="ghost" onClick={save}>{saved?'Saved ✓':'Save listing'}</button></div>
<div className="panel"><h3>Food nearby</h3>{m.length?m.map(x=><div className="row" key={x.id}><span><b>{x.name}</b><br/><span className="mut">{x.kind}</span></span><b>{inr(x.price_per_meal)}/meal</b></div>):<p className="mut">No messes added for {l.area} yet.</p>}</div></div>
<form className="panel stack" onSubmit={send}><h3>Ask the owner</h3><textarea required rows="5" placeholder="Hi, is a room still available from next month?" value={msg} onChange={e=>setMsg(e.target.value)}/><button>{user?'Send enquiry':'Log in to enquire'}</button>{note&&<div className="ok">{note}</div>}</form></div></main>}

function Auth(){const[mode,setMode]=useState('in');const[f,setF]=useState({name:'',email:'',password:'',role:'fresher'});const[err,setErr]=useState('')
const set=k=>e=>setF({...f,[k]:e.target.value})
const submit=async e=>{e.preventDefault();setErr('');const r=mode==='in'?await supabase.auth.signInWithPassword({email:f.email,password:f.password}):await supabase.auth.signUp({email:f.email,password:f.password,options:{data:{name:f.name,role:f.role}}})
if(r.error)setErr(r.error.message);else if(mode==='up'&&!r.data.session)setErr('Account created. Confirm your email, then log in.');else go('/account')}
return <main className="wrap"><h2>{mode==='in'?'Welcome back':'Join Homey'}</h2><form className="stack" onSubmit={submit}>
{mode==='up'&&<><input required placeholder="Your name" value={f.name} onChange={set('name')}/><select value={f.role} onChange={set('role')}><option value="fresher">I'm a student looking for a place</option><option value="owner">I'm a PG / flat owner</option></select></>}
<input required type="email" placeholder="Email" value={f.email} onChange={set('email')}/><input required type="password" minLength="6" placeholder="Password (min 6 characters)" value={f.password} onChange={set('password')}/>
<button>{mode==='in'?'Log in':'Create account'}</button>{err&&<div className="err">{err}</div>}</form>
<p><button className="ghost" onClick={()=>setMode(mode==='in'?'up':'in')}>{mode==='in'?'New here? Create an account':'Have an account? Log in'}</button></p></main>}

function Fresher({user}){const[saved,setSaved]=useState([]);const[enq,setEnq]=useState([])
useEffect(()=>{supabase.from('saved').select('listings(*)').eq('user_id',user.id).then(({data})=>setSaved((data||[]).map(r=>r.listings).filter(Boolean)))
supabase.from('enquiries').select('*,listings(title)').eq('user_id',user.id).order('created_at',{ascending:false}).then(({data})=>setEnq(data||[]))},[user])
return <><h3>Saved listings</h3>{saved.length?<div className="grid">{saved.map(l=><Card key={l.id} l={l}/>)}</div>:<p className="mut">Nothing saved yet. <a href="#/listings">Browse listings</a>.</p>}
<h3 style={{marginTop:30}}>Your enquiries</h3><div className="panel">{enq.length?enq.map(e=><div className="row" key={e.id}><span><b>{e.listings?.title}</b><br/>{e.message}</span><span className="mut">{new Date(e.created_at).toLocaleDateString('en-IN')}</span></div>):<span className="mut">No enquiries sent yet.</span>}</div></>}

function Owner({user,profile}){const blank={title:'',type:'PG',area:'',rent:'',gender:'Any',distance_km:'',description:'',contact:'',amenities:[]}
const[mine,setMine]=useState([]);const[enq,setEnq]=useState([]);const[f,setF]=useState(blank);const[err,setErr]=useState('')
const load=()=>{supabase.from('listings').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}).then(({data})=>setMine(data||[]))
supabase.from('enquiries').select('*,listings!inner(title,owner_id),profiles(name)').eq('listings.owner_id',user.id).order('created_at',{ascending:false}).then(({data})=>setEnq(data||[]))}
useEffect(load,[user])
const set=k=>e=>setF({...f,[k]:e.target.value})
const tog=a=>setF({...f,amenities:f.amenities.includes(a)?f.amenities.filter(x=>x!==a):[...f.amenities,a]})
const add=async e=>{e.preventDefault();setErr('');const{error}=await supabase.from('listings').insert({...f,rent:+f.rent,distance_km:+f.distance_km||1,owner_id:user.id,owner_name:profile.name});if(error)setErr(error.message);else{setF(blank);load()}}
const del=async id=>{if(confirm('Delete this listing?')){await supabase.from('listings').delete().eq('id',id);load()}}
return <><form className="panel stack wide" onSubmit={add}><h3 className="full">Add a listing</h3>
<input required placeholder="Listing name" value={f.title} onChange={set('title')}/><select value={f.type} onChange={set('type')}><option>PG</option><option>Flat</option><option>Hostel</option></select>
<input required placeholder="Area (e.g. Karve Nagar)" value={f.area} onChange={set('area')}/><input required type="number" min="0" placeholder="Rent per month (₹)" value={f.rent} onChange={set('rent')}/>
<input type="number" step="0.1" min="0" placeholder="Distance from campus (km)" value={f.distance_km} onChange={set('distance_km')}/><select value={f.gender} onChange={set('gender')}><option>Any</option><option>Boys</option><option>Girls</option></select>
<input placeholder="Contact number" value={f.contact} onChange={set('contact')}/><textarea className="full" rows="3" placeholder="Describe rooms, rules and what is included" value={f.description} onChange={set('description')}/>
<div className="full am">{AMEN.map(a=><label key={a}><input type="checkbox" checked={f.amenities.includes(a)} onChange={()=>tog(a)}/>{a}</label>)}</div>
<div className="full"><button>Publish listing</button>{err&&<span className="err"> {err}</span>}</div></form>
<h3>Your listings</h3><div className="panel">{mine.length?mine.map(l=><div className="row" key={l.id}><span><a href={`#/listing/${l.id}`}><b>{l.title}</b></a> <span className="mut">{inr(l.rent)}/mo</span></span><button className="ghost" onClick={()=>del(l.id)}>Delete</button></div>):<span className="mut">No listings yet. Add your first one above.</span>}</div>
<h3>Enquiries received</h3><div className="panel">{enq.length?enq.map(e=><div className="row" key={e.id}><span><b>{e.profiles?.name||'A student'}</b> on {e.listings?.title}<br/>{e.message}</span><span className="mut">{new Date(e.created_at).toLocaleDateString('en-IN')}</span></div>):<span className="mut">No enquiries yet.</span>}</div></>}

function Account({user,profile}){if(!user)return <main className="wrap"><p>Please <a href="#/login">log in</a> to see your account.</p></main>
if(!profile)return <main className="wrap">Loading…</main>
return <main className="wrap"><h2>Hi, {profile.name||'there'}</h2><p className="mut">{profile.role==='owner'?'Owner dashboard':'Student account'}</p>{profile.role==='owner'?<Owner user={user} profile={profile}/>:<Fresher user={user}/>}</main>}

export default function App(){const hash=useHash();const[session,setSession]=useState(null);const[profile,setProfile]=useState(null)
useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const{data:l}=supabase.auth.onAuthStateChange((_,s)=>setSession(s));return()=>l.subscription.unsubscribe()},[])
const user=session?.user||null
useEffect(()=>{if(!user){setProfile(null);return}supabase.from('profiles').select('*').eq('id',user.id).single().then(({data})=>setProfile(data))},[user?.id])
const[path,qs]=hash.split('?');const[,p,id]=path.split('/')
const logout=async()=>{await supabase.auth.signOut();go('/')}
return <><nav><a href="#/" className="logo"><span>H</span>omey</a><div><a href="#/listings">Listings</a>{user?<><a href="#/account">{profile?.role==='owner'?'Dashboard':'Account'}</a><a href="#/" onClick={logout}>Log out</a></>:<a href="#/login">Log in</a>}</div></nav>
{p==='listings'?<Listings params={new URLSearchParams(qs||'')}/>:p==='listing'?<Detail id={id} user={user}/>:p==='login'?<Auth/>:p==='account'?<Account user={user} profile={profile}/>:<Home/>}</>}
