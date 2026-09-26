// Focused release checks for the visual patch; no browser or new dependencies.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const name of ['visual-ui','feedback.integration','economy','evidence','i18n','sim']){
  const r=spawnSync(process.execPath,['test/'+name+'.test.js'],{cwd:root,stdio:'inherit'});
  if(r.error){console.error(r.error.message);process.exit(1);}
  if(r.status!==0)process.exit(r.status||1);
}
console.log('Visual patch checks passed. Browser rendering is a separate, unperformed check.');
