const CONFIG_KEY = 'rrhh_config_v2';

let empleados = [];
let generalExtras = {};
let selectedId = '';

let config = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') || {
  isss: 3.00,
  topeIsss: 1000.00,
  afp: 7.25
};

function money(n){ return '$' + Number(n || 0).toFixed(2); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function saveEmployees(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(empleados)); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function dateLong(v){
  if(!v) return '---';
  const d = new Date(v + 'T00:00:00');
  return `${d.getDate()} DE ${d.toLocaleString('es-ES',{month:'long'}).toUpperCase()} ${d.getFullYear()}`;
}

async function cargarCargos()
{
    try
    {
        const respuesta =
            await fetch("../php/listar_cargos.php");

        const data =
            await respuesta.json();

        if (!data.success)
        {
            console.error(
                "Error cargando cargos:",
                data.mensaje
            );

            alert(
                "No se pudieron cargar los cargos."
            );

            return;
        }

        const select =
            document.getElementById("emp-cargo");

        select.innerHTML = `
            <option value="">
                -- Seleccione un cargo --
            </option>
        `;

        data.cargos.forEach(cargo =>
        {
            const opcion =
                document.createElement("option");

            opcion.value =
                String(cargo.cargo_id);

            opcion.textContent =
                cargo.nombre;

            select.appendChild(opcion);
        });
    }
    catch(error)
    {
        console.error(
            "Error al conectar con cargos:",
            error
        );
    }
}

async function cargarEmpleados()
{
    try
    {
        const respuesta =
            await fetch("../php/listar_empleados.php");

        const data =
            await respuesta.json();

        if (!data.success)
        {
            console.error(
                "Error del servidor:",
                data.mensaje
            );

            alert(
                "No se pudieron cargar los empleados."
            );

            return;
        }

        empleados = data.empleados.map(e => ({
            id: String(e.empleado_id),

            nombre:
                e.nombre_completo,

            cargo_id:
                String(e.cargo_id ?? ''),

            cargo:
                e.cargo ?? 'SIN CARGO',

            sueldo:
                Number(e.salario),

            afp:
                e.cotizaciones ?? ''
        }));

        renderEmployees();
        renderSelect();
        renderIndividual();
        renderGeneral();
        updateDashboard();
    }
    catch(error)
    {
        console.error(
            "Error cargando empleados:",
            error
        );

        alert(
            "Error al conectar con la base de datos."
        );
    }
}

function calc(emp, dias=31, vacacion=0, renta=0, otros=0){
  dias = Math.max(0, Math.min(31, Number(dias)||0));
  let base = (Number(emp.sueldo) / 30) * dias;
  if(dias === 31 && base > Number(emp.sueldo)) base = Number(emp.sueldo);
  const devengado = base + Number(vacacion||0);
  const isss = Math.min(devengado, Number(config.topeIsss)) * (Number(config.isss)/100);
  const afpTotal = devengado * (Number(config.afp)/100);
  const afpConfia = emp.afp === 'CONFIA' ? afpTotal : 0;
  const afpCrecer = emp.afp === 'CRECER' ? afpTotal : 0;
  const totalDesc = isss + afpTotal + Number(renta||0) + Number(otros||0);
  const liquido = devengado - totalDesc;
  return {dias, base, vacacion:Number(vacacion||0), devengado, renta:Number(renta||0), afpTotal, afpConfia, afpCrecer, isss, otros:Number(otros||0), totalDesc, liquido};
}

function boletaHTML(emp, c, fecha, numero){
  return `
  <div class="boleta">
    <div class="grid grid-cols-[1fr_1.4fr_.45fr] gap-3 items-start">
      <div class="text-[12px] leading-5 font-bold">
        <div>SONSONATE ESTE DISTRITO DE ARMENIA</div>
        <div>(RR-HH)</div>
        <div>Dirección: AV. 3 DE ABRIL N°1</div>
        <div>ARMENIA, SONSONATE</div>
      </div>
      <div>
        <div class="title mb-3">BOLETA DE PAGO: ${esc(emp.cargo)}</div>
        <div class="grid grid-cols-[80px_1fr] gap-2 items-center mb-2">
          <b>FECHA:</b><div class="box text-red-700">FECHA DE EMISIÓN: ${dateLong(fecha)}</div>
        </div>
        <div class="grid grid-cols-[80px_1fr] gap-2 items-center">
          <b>NOMBRE:</b><div class="box">${esc(emp.nombre)}</div>
        </div>
      </div>
      <div class="text-center">
        <div class="mx-auto h-20 w-20 rounded-full border border-dashed border-blue-900 flex items-center justify-center text-[8px] font-bold">GOBIERNO<br>MUNICIPAL<br>SONSONATE ESTE<br>DISTRITO ARMENIA</div>
        <div class="font-bold mt-2">${numero}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">Días<br>Laborados</th>
          <th rowspan="2">Sueldo<br>Base</th>
          <th rowspan="2">Vacación<br>30%</th>
          <th rowspan="2">Importe<br>Devengado</th>
          <th rowspan="2">Renta</th>
          <th colspan="3">C O T I Z A C I O N E S</th>
          <th rowspan="2">Préstamos<br>y otros</th>
          <th rowspan="2">Total<br>Descuentos</th>
          <th rowspan="2">Importe<br>Líquido</th>
        </tr>
        <tr><th>AFP<br>CONFIA</th><th>AFP<br>CRECER</th><th>ISSS</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${c.dias}</td><td>${money(c.base)}</td><td>${money(c.vacacion)}</td><td><b>${money(c.devengado)}</b></td>
          <td>${money(c.renta)}</td><td>${money(c.afpConfia)}</td><td>${money(c.afpCrecer)}</td><td>${money(c.isss)}</td>
          <td>${money(c.otros)}</td><td><b>${money(c.totalDesc)}</b></td><td><b>${money(c.liquido)}</b></td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function showSection(sec){
  ['dashboard','empleados','planilla','config'].forEach(s=>{
    document.getElementById('sec-'+s).classList.toggle('hidden', s!==sec);
  });
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.classList.toggle('bg-white/10', b.dataset.sec===sec);
  });
  document.getElementById('mobileNav').value = sec;
  if(sec==='empleados') renderEmployees();
  if(sec==='planilla'){ renderSelect(); renderGeneral(); renderIndividual(); }
  if(sec==='dashboard') updateDashboard();
}
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.sec)));
document.getElementById('mobileNav').addEventListener('change',e=>showSection(e.target.value));

function setPlanillaMode(mode){
  document.getElementById('mode-individual').classList.toggle('hidden', mode!=='individual');
  document.getElementById('mode-general').classList.toggle('hidden', mode!=='general');
  document.getElementById('tab-individual').className = 'px-5 py-2.5 rounded-lg font-semibold ' + (mode==='individual'?'tab-active':'tab-inactive');
  document.getElementById('tab-general').className = 'px-5 py-2.5 rounded-lg font-semibold ' + (mode==='general'?'tab-active':'tab-inactive');
  if(mode==='general') renderGeneral();
}

function renderEmployees(){
  const q = document.getElementById('emp-search').value.trim().toUpperCase();
  const rows = empleados.filter(e => !q || e.nombre.includes(q) || e.cargo.includes(q));
  const body = document.getElementById('empleados-body');
  body.innerHTML = rows.map((e,i)=>`
    <tr class="border-t hover:bg-gray-50">
      <td class="p-4">${i+1}</td>
      <td class="p-4 font-semibold">${esc(e.nombre)}</td>
      <td class="p-4"><span class="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">${esc(e.cargo)}</span></td>
      <td class="p-4 text-right">${money(e.sueldo)}</td>
      <td class="p-4 text-center">${esc(e.afp)}</td>
      <td class="p-4 text-right whitespace-nowrap">
        <button onclick="editEmployee('${e.id}')" class="text-indigo-700 px-2" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteEmployee('${e.id}')" class="text-red-600 px-2" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
  document.getElementById('empleados-empty').classList.toggle('hidden', rows.length!==0);
  document.getElementById('emp-count').textContent = `${rows.length} de ${empleados.length} empleados`;
}
document.getElementById('emp-search').addEventListener('input', renderEmployees);

function openEmployeeModal(){
  document.getElementById('employee-form').reset();
  document.getElementById('emp-id').value='';
  document.getElementById('employee-modal-title').textContent='Nuevo empleado';
  document.getElementById('employee-modal').classList.add('open');
}
function closeEmployeeModal(){ document.getElementById('employee-modal').classList.remove('open'); }
function editEmployee(id) {

    const e =
        empleados.find(x => x.id === id);

    if (!e) {
        return;
    }

    document.getElementById('emp-id').value =
        e.id;

    document.getElementById('emp-nombre').value =
        e.nombre;

    document.getElementById('emp-cargo').value =
        e.cargo_id;

    document.getElementById('emp-sueldo').value =
        e.sueldo;

    document.getElementById('emp-afp').value =
        e.afp;

    document.getElementById(
        'employee-modal-title'
    ).textContent =
        'Editar empleado';

    document
        .getElementById('employee-modal')
       .classList.add('open');
}
function deleteEmployee(id){
  const e=empleados.find(x=>x.id===id);
  if(!e || !confirm(`¿Eliminar a ${e.nombre}?`)) return;
  empleados=empleados.filter(x=>x.id!==id); saveEmployees(); renderEmployees(); renderSelect(); renderGeneral(); updateDashboard();
}
document
    .getElementById('employee-form')
    .addEventListener('submit', async function(ev) {

        ev.preventDefault();

        const id =  document.getElementById('emp-id').value;

        const nombre = document.getElementById('emp-nombre').value.trim().toUpperCase();

        const cargo =
        document.getElementById('emp-cargo').value;

      if (!cargo) {

          alert(
              'Debe seleccionar el tipo de boleta / área.'
          );

          return;
      }

      const sueldo =
          Number(
              document.getElementById('emp-sueldo').value
          );

      const afp =
          document.getElementById('emp-afp').value;


        if (!id) {
            alert('No se encontró el ID del empleado.');
            return;
        }


        try {

            const respuesta =
                await fetch(
                    '../php/actualizar_empleado.php',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({
                            empleado_id: id,
                            nombre_completo: nombre,
                            cargo_id: parseInt(cargo),
                            salario: sueldo,
                            cotizaciones: afp
                        })
                    }
                );


            const resultado =
                await respuesta.json();


            if (!resultado.success) {

                alert(
                    resultado.mensaje ||
                    'No fue posible actualizar el empleado.'
                );

                return;
            }


            closeEmployeeModal();

          
          await cargarEmpleados();

            alert(
                'Empleado actualizado correctamente.'
            );


        } catch (error) {

            console.error(
                'Error actualizando empleado:',
                error
            );

            alert(
                'Error al conectar con el servidor.'
            );
        }

    });
function renderSelect(){
  const s=document.getElementById('calc-empleado');
  const prev=s.value || selectedId;
  s.innerHTML='<option value="">-- Seleccione empleado --</option>'+empleados.map(e=>`<option value="${e.id}">${esc(e.nombre)} (${money(e.sueldo)})</option>`).join('');
  if(empleados.some(e=>e.id===prev)) s.value=prev;
}
function renderIndividual(){
  selectedId=document.getElementById('calc-empleado').value;
  const emp=empleados.find(e=>e.id===selectedId);
  const area=document.getElementById('boleta-individual');
  const btn=document.getElementById('btn-print-individual');
  if(!emp){
    area.innerHTML='<div class="boleta min-h-[260px] flex items-center justify-center text-gray-400"><div class="text-center"><i class="fa-solid fa-receipt text-4xl mb-3"></i><br>Seleccione un empleado para generar la boleta.</div></div>';
    btn.disabled=true; return;
  }
  const c=calc(emp, document.getElementById('calc-dias').value, document.getElementById('calc-vacacion').value, document.getElementById('calc-renta').value, document.getElementById('calc-otros').value);
  area.innerHTML=boletaHTML(emp,c,document.getElementById('calc-fecha').value,empleados.findIndex(e=>e.id===emp.id)+1);
  btn.disabled=false;
}
['calc-empleado','calc-dias','calc-vacacion','calc-renta','calc-otros','calc-fecha'].forEach(id=>{
  document.getElementById(id).addEventListener('input', renderIndividual);
  document.getElementById(id).addEventListener('change', renderIndividual);
});

function renderGeneral(){
  const diasDefault = Number(document.getElementById('general-dias').value || 31);
  const body=document.getElementById('general-body');
  let totals={base:0,vacacion:0,renta:0,afp:0,isss:0,otros:0,totalDesc:0,liquido:0};
  body.innerHTML=empleados.map((e,i)=>{
    const x=generalExtras[e.id] || {dias:diasDefault,vacacion:0,renta:0,otros:0};
    if(x.dias===undefined) x.dias=diasDefault;
    const c=calc(e,x.dias,x.vacacion,x.renta,x.otros);
    Object.keys(totals).forEach(k=>totals[k]+= (k==='afp'?c.afpTotal:c[k]));
    return `<tr class="border-t">
      <td class="p-3">${i+1}</td>
      <td class="p-3 font-semibold">${esc(e.nombre)}<div class="text-[10px] font-normal text-gray-400">${esc(e.cargo)} · ${esc(e.afp)}</div></td>
      <td class="p-2"><input class="w-16 border rounded p-1.5 text-center" type="number" min="0" max="31" value="${x.dias}" oninput="updateGeneral('${e.id}','dias',this.value)"></td>
      <td class="p-3 text-right">${money(c.base)}</td>
      <td class="p-2"><input class="w-20 border rounded p-1.5 text-right" type="number" step=".01" value="${Number(x.vacacion||0).toFixed(2)}" oninput="updateGeneral('${e.id}','vacacion',this.value)"></td>
      <td class="p-2"><input class="w-20 border rounded p-1.5 text-right" type="number" step=".01" value="${Number(x.renta||0).toFixed(2)}" oninput="updateGeneral('${e.id}','renta',this.value)"></td>
      <td class="p-3 text-right">${money(c.afpTotal)}</td>
      <td class="p-3 text-right">${money(c.isss)}</td>
      <td class="p-2"><input class="w-20 border rounded p-1.5 text-right" type="number" step=".01" value="${Number(x.otros||0).toFixed(2)}" oninput="updateGeneral('${e.id}','otros',this.value)"></td>
      <td class="p-3 text-right">${money(c.totalDesc)}</td>
      <td class="p-3 text-right font-bold">${money(c.liquido)}</td>
    </tr>`;
  }).join('');
  document.getElementById('general-foot').innerHTML=`<tr>
    <td colspan="3" class="p-3 text-right">TOTALES</td>
    <td class="p-3 text-right">${money(totals.base)}</td>
    <td class="p-3 text-right">${money(totals.vacacion)}</td>
    <td class="p-3 text-right">${money(totals.renta)}</td>
    <td class="p-3 text-right">${money(totals.afp)}</td>
    <td class="p-3 text-right">${money(totals.isss)}</td>
    <td class="p-3 text-right">${money(totals.otros)}</td>
    <td class="p-3 text-right">${money(totals.totalDesc)}</td>
    <td class="p-3 text-right">${money(totals.liquido)}</td>
  </tr>`;
}
function updateGeneral(id,field,val){
  generalExtras[id]=generalExtras[id]||{};
  generalExtras[id][field]=Number(val||0);
  renderGeneral();
}
document.getElementById('general-dias').addEventListener('change',()=>{
  const d=Number(document.getElementById('general-dias').value||31);
  empleados.forEach(e=>{generalExtras[e.id]=generalExtras[e.id]||{};generalExtras[e.id].dias=d;});
  renderGeneral();
});

function buildGeneralPrint(){
  const fecha=document.getElementById('general-fecha').value;
  const diasDefault=Number(document.getElementById('general-dias').value||31);
  let totals={base:0,vacacion:0,renta:0,afp:0,isss:0,otros:0,totalDesc:0,liquido:0};
  const rows=empleados.map((e,i)=>{
    const x=generalExtras[e.id]||{dias:diasDefault,vacacion:0,renta:0,otros:0};
    const c=calc(e,x.dias??diasDefault,x.vacacion,x.renta,x.otros);
    Object.keys(totals).forEach(k=>totals[k]+= (k==='afp'?c.afpTotal:c[k]));
    return `<tr><td>${i+1}</td><td>${esc(e.nombre)}</td><td>${c.dias}</td><td>${money(c.base)}</td><td>${money(c.vacacion)}</td><td>${money(c.renta)}</td><td>${money(c.afpTotal)}</td><td>${money(c.isss)}</td><td>${money(c.otros)}</td><td>${money(c.totalDesc)}</td><td><b>${money(c.liquido)}</b></td></tr>`;
  }).join('');
  document.getElementById('general-print-area').innerHTML=`
    <div class="p-3">
      <div class="text-center mb-4">
        <h1 class="text-xl font-bold text-[#263c86]">GOBIERNO MUNICIPAL DE SONSONATE ESTE</h1>
        <h2 class="font-bold">PLANILLA GENERAL DE PAGO - DISTRITO DE ARMENIA</h2>
        <p class="text-sm">Fecha de emisión: ${dateLong(fecha)} · Total empleados: ${empleados.length}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px">
        <thead><tr>${['#','Empleado','Días','Sueldo','Vacación','Renta','AFP','ISSS','Otros','Descuentos','Líquido'].map(x=>`<th style="border:1px solid #334155;padding:5px">${x}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="font-weight:bold;background:#eef2ff">
          <td colspan="3" style="border:1px solid #334155;padding:5px;text-align:right">TOTALES</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.base)}</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.vacacion)}</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.renta)}</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.afp)}</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.isss)}</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.otros)}</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.totalDesc)}</td>
          <td style="border:1px solid #334155;padding:5px">${money(totals.liquido)}</td>
        </tr></tfoot>
      </table>
      <div class="grid grid-cols-3 gap-10 mt-14 text-center text-xs">
        <div class="border-t pt-2">Elaboró</div><div class="border-t pt-2">Revisó</div><div class="border-t pt-2">Autorizó</div>
      </div>
    </div>`;
  // style td
  document.querySelectorAll('#general-print-area td').forEach(td=>{td.style.border='1px solid #334155';td.style.padding='5px';});
}
function printGeneralList(){
  if(!empleados.length){ alert('No hay empleados registrados.'); return; }
  buildGeneralPrint();
  switchPrintTarget('general-print-area');
}
function buildAllSlips()
{
    const fecha = document.getElementById('general-fecha').value;
    const diasDefault = Number(document.getElementById('general-dias').value || 31);

    const contenedor = document.getElementById('all-slips-print-area');

    let html = '';

    for(let i = 0; i < empleados.length; i += 3)
    {
        html += `<div class="pagina-boletas">`;

        const grupo = empleados.slice(i, i + 3);

        grupo.forEach((e, indice) =>
        {
            const x = generalExtras[e.id] || {
                dias: diasDefault,
                vacacion: 0,
                renta: 0,
                otros: 0
            };

            const c = calc(
                e,
                x.dias ?? diasDefault,
                x.vacacion,
                x.renta,
                x.otros
            );

            html += `
                <div class="boleta-wrapper">
                    ${boletaHTML(e, c, fecha, i + indice + 1)}
                </div>
            `;
        });

        html += `</div>`;
    }

    contenedor.innerHTML = html;
}
function printAllSlips()
{
    if(!empleados.length)
    {
        alert('No hay empleados registrados.');
        return;
    }

    buildAllSlips();
    switchPrintTarget('all-slips-print-area');
}
function printIndividual(){ switchPrintTarget('individual-print-area'); }
function switchPrintTarget(id){
  document.querySelectorAll('.print-target').forEach(x=>x.classList.remove('print-target'));
  document.getElementById(id).classList.add('print-target');
  window.print();
  setTimeout(()=>document.getElementById(id).classList.remove('print-target'),300);
}

function updateDashboard(){
  document.getElementById('stat-empleados').textContent=empleados.length;
  let sueldo=0,afp=0,liquido=0;
  empleados.forEach(e=>{const c=calc(e,31,0,0,0);sueldo+=c.base;afp+=c.afpTotal;liquido+=c.liquido;});
  document.getElementById('stat-sueldos').textContent=money(sueldo);
  document.getElementById('stat-afp').textContent=money(afp);
  document.getElementById('stat-liquido').textContent=money(liquido);
}

function saveConfig(){
  config={
    isss:Number(document.getElementById('conf-isss').value),
    topeIsss:Number(document.getElementById('conf-tope-isss').value),
    afp:Number(document.getElementById('conf-afp').value)
  };
  localStorage.setItem(CONFIG_KEY,JSON.stringify(config));
  renderGeneral();renderIndividual();updateDashboard();
  alert('Parámetros guardados.');
}
function resetConfig(){
  config={isss:3,topeIsss:1000,afp:7.25};
  document.getElementById('conf-isss').value=config.isss;
  document.getElementById('conf-tope-isss').value=config.topeIsss;
  document.getElementById('conf-afp').value=config.afp;
  saveConfig();
}
function exportarDatos(){
  const data={version:2,exportado:new Date().toISOString(),empleados,config};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='respaldo_rrhh_planillas.json';a.click();URL.revokeObjectURL(a.href);
}
document.getElementById('import-file').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!Array.isArray(d.empleados)) throw new Error();
      empleados=d.empleados;
      if(d.config) config=d.config;
      saveEmployees();localStorage.setItem(CONFIG_KEY,JSON.stringify(config));
      location.reload();
    }catch(_){alert('El archivo no es un respaldo válido.');}
  };
  r.readAsText(f);
});

window.addEventListener('load', async () =>
{
    document.getElementById('calc-fecha').value = todayISO();
    document.getElementById('general-fecha').value = todayISO();

    document.getElementById('stat-fecha').textContent =
        new Date().toLocaleDateString(
            'es-ES',
            {
                day:'2-digit',
                month:'long',
                year:'numeric'
            }
        );

    document.getElementById('conf-isss').value = config.isss;
    document.getElementById('conf-tope-isss').value = config.topeIsss;
    document.getElementById('conf-afp').value = config.afp;

     await cargarCargos();
    await cargarEmpleados();
});