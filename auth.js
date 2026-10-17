/* BunnyTools Auth — Supabase login/signup, self-injecting. Hidden until owner configures keys. */
(function(){
  var sb = null, mode = 'login';

  function el(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstChild; }

  function injectUI(){
    // Add auth buttons to nav
    var nav = document.querySelector('nav .nav-in, nav');
    if(!nav || document.getElementById('bt-authbtn')) return;
    var wrap = el('<span id="bt-authwrap" style="display:flex;gap:8px;align-items:center;margin-left:8px"></span>');
    wrap.innerHTML = '<button id="bt-authbtn" class="btn btn-yellow" style="padding:9px 20px;cursor:pointer;border:none;font:inherit">Log in</button>'
      + '<span id="bt-userchip" style="display:none;align-items:center;gap:8px"></span>';
    nav.appendChild(wrap);

    // Modal
    var m = el('<div id="bt-authmodal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;align-items:center;justify-content:center;padding:20px">'
      + '<div style="background:#1a1a1a;color:#fff;border-radius:22px;padding:32px 28px;max-width:380px;width:100%;border:2px solid #FFC800">'
      + '<h2 id="bt-authtitle" style="margin:0 0 16px">🔐 Log in</h2>'
      + '<input id="bt-authemail" type="email" placeholder="Email" style="width:100%;padding:12px;border-radius:10px;border:1px solid #444;background:#222;color:#fff;margin-bottom:10px;box-sizing:border-box">'
      + '<input id="bt-authpass" type="password" placeholder="Password (min 6 chars)" style="width:100%;padding:12px;border-radius:10px;border:1px solid #444;background:#222;color:#fff;margin-bottom:10px;box-sizing:border-box">'
      + '<p id="bt-autherr" style="color:#ff8080;font-size:.85rem;min-height:1.2em;margin:0 0 8px"></p>'
      + '<button id="bt-authgo" class="btn btn-yellow" style="width:100%;padding:12px;cursor:pointer;border:none;font:inherit">Log in</button>'
      + '<p style="text-align:center;margin:12px 0 0"><a href="#" id="bt-authswitch" style="color:#FFC800;font-size:.9rem">New here? Sign up</a></p>'
      + '<p style="text-align:center;margin:8px 0 0"><a href="#" id="bt-authcancel" style="color:#999;font-size:.85rem">Cancel</a></p>'
      + '</div></div>');
    document.body.appendChild(m);

    document.getElementById('bt-authbtn').onclick = function(){ setMode('login'); show(true); };
    document.getElementById('bt-authcancel').onclick = function(e){ e.preventDefault(); show(false); };
    m.onclick = function(e){ if(e.target===m) show(false); };
    document.getElementById('bt-authswitch').onclick = function(e){ e.preventDefault(); setMode(mode==='login'?'signup':'login'); };
    document.getElementById('bt-authgo').onclick = doAuth;
  }

  function setMode(m){ mode=m;
    document.getElementById('bt-authtitle').textContent = m==='login' ? '🔐 Log in' : '📝 Sign up';
    document.getElementById('bt-authgo').textContent = m==='login' ? 'Log in' : 'Create account';
    document.getElementById('bt-authswitch').textContent = m==='login' ? 'New here? Sign up' : 'Have an account? Log in';
    document.getElementById('bt-autherr').textContent = '';
  }
  function show(v){ document.getElementById('bt-authmodal').style.display = v?'flex':'none'; }

  async function doAuth(){
    if(!sb) return;
    var em = document.getElementById('bt-authemail').value.trim();
    var pw = document.getElementById('bt-authpass').value;
    var err = document.getElementById('bt-autherr');
    if(!em || pw.length<6){ err.textContent='Email + password (min 6 chars) required.'; return; }
    err.textContent='…';
    try{
      var r = mode==='login'
        ? await sb.auth.signInWithPassword({email:em,password:pw})
        : await sb.auth.signUp({email:em,password:pw});
      if(r.error){ err.textContent=r.error.message; return; }
      show(false);
    }catch(e){ err.textContent='Something went wrong — try again.'; }
  }

  function setUser(u){
    var btn=document.getElementById('bt-authbtn'), chip=document.getElementById('bt-userchip');
    if(!btn||!chip) return;
    if(u){
      btn.style.display='none'; chip.style.display='flex';
      var name=String(u.email).split('@')[0].replace(/[<>&"]/g,'');
      chip.innerHTML='<span style="font-size:.85rem;font-weight:700;background:#1a1a1a;color:#FFC800;border-radius:20px;padding:8px 14px;border:1.5px solid #FFC800">👤 '+name+'</span>'
        +'<button id="bt-logout" style="background:none;border:none;color:#999;cursor:pointer;font-size:.85rem">Logout</button>';
      document.getElementById('bt-logout').onclick=function(){ sb.auth.signOut(); };
    }else{
      btn.style.display=''; chip.style.display='none'; chip.innerHTML='';
    }
  }

  async function init(){
    try{
      var r = await fetch('/api/config'); var c = await r.json();
      if(!c.supabaseUrl || !c.supabaseAnonKey || !window.supabase) return; // not configured → stay hidden
      sb = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);
      injectUI();
      var s = await sb.auth.getSession();
      setUser(s.data.session ? s.data.session.user : null);
      sb.auth.onAuthStateChange(function(_ev,sess){ setUser(sess?sess.user:null); });
    }catch(e){ /* auth unavailable — site works without it */ }
  }

  window.BTAuth = { init: init, client: function(){ return sb; }, user: function(){ return sb&&sb._user||null; } };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
