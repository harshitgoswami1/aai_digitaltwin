import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = '/Users/harshitgoswami/UNI/AAI/backend';
const skillDir = '/Users/harshitgoswami/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations';
const buildDir = path.join(workspaceDir, '.presentation-build');
const outputDir = path.join(workspaceDir, 'output');
const finalPath = path.join(outputDir, 'how-ai-models-learn-and-work.pptx');
const W = 1280, H = 720;
const C = { bg:'#F7F5EF', ink:'#17213B', muted:'#536077', accent:'#D65A38', pale:'#E9E5DB' };

await fs.mkdir(buildDir, { recursive:true });
await fs.mkdir(outputDir, { recursive:true });
const deck = Presentation.create({ slideSize:{width:W,height:H} });

function textbox(slide, text, x, y, w, h, size, color=C.ink, bold=false) {
  const shape=slide.shapes.add({
    geometry:'textbox', position:{left:x,top:y,width:w,height:h},
    fill:'none', line:{style:'solid',fill:'none',width:0}
  });
  shape.text=text;
  shape.text.style={fontFamily:'Aptos',fontSize:size,color,bold};
  return shape;
}
function slideBase(index, title) {
  const s=deck.slides.add();
  s.background.fill=C.bg;
  if (title) textbox(s,title,78,62,1110,70,42,C.ink,true);
  textbox(s,String(index).padStart(2,'0'),1175,657,42,25,16,C.muted);
  return s;
}

// 1. Title
{
  const s=slideBase(1);
  textbox(s,'How an AI model\nlearns and works',78,178,1060,190,66,C.ink,true);
  textbox(s,'A simple guide to training and answering questions',82,405,930,66,27,C.muted);
  textbox(s,'LANGUAGE MODELS',81,105,500,32,17,C.accent,true);
}

// 2. Core idea
{
  const s=slideBase(2,'The basic idea');
  textbox(s,'A language model learns patterns in text by practicing one task:',80,166,1080,85,29,C.muted);
  textbox(s,'predict what comes next.',80,255,1070,82,49,C.accent,true);
  textbox(s,'“The cat sat on the ...”',81,393,1000,74,38,C.ink,true);
  textbox(s,'Training helps the model assign a higher chance to likely continuations, such as “mat.”',81,492,1030,104,26,C.muted);
}

// 3. Training
{
  const s=slideBase(3,'How training works');
  textbox(s,'1',80,182,70,80,53,C.accent,true);
  textbox(s,'Read examples',165,185,430,60,33,C.ink,true);
  textbox(s,'The model processes large collections of text.',165,246,990,55,23,C.muted);
  textbox(s,'2',80,341,70,80,53,C.accent,true);
  textbox(s,'Make a prediction',165,344,540,60,33,C.ink,true);
  textbox(s,'It predicts the next piece of text and compares that prediction with the example.',165,405,1000,65,23,C.muted);
  textbox(s,'3',80,511,70,80,53,C.accent,true);
  textbox(s,'Adjust the model',165,514,540,60,33,C.ink,true);
  textbox(s,'Small changes to its internal weights improve future predictions.',165,575,1000,61,23,C.muted);
}

// 4. Improvement after initial training
{
  const s=slideBase(4,'Making the model more useful');
  textbox(s,'Prediction training gives the model a broad grasp of language.',80,173,1080,85,32,C.ink,true);
  textbox(s,'Further training can use example answers and human feedback to help it follow instructions and respond more helpfully.',80,305,1060,132,29,C.muted);
  textbox(s,'Developers also test the model to find mistakes and improve its behavior.',80,490,1050,90,29,C.accent,true);
}

// 5. Answering a question
{
  const s=slideBase(5,'What happens when you ask');
  textbox(s,'Your question',80,177,315,62,32,C.ink,true);
  textbox(s,'The model reads your prompt and the available conversation context.',80,239,1010,65,24,C.muted);
  textbox(s,'Next words',80,340,315,62,32,C.ink,true);
  textbox(s,'It chooses a likely next piece of text, then repeats the process to form a response.',80,402,1050,93,24,C.muted);
  textbox(s,'Answer',80,535,315,62,32,C.accent,true);
  textbox(s,'The result can vary, even for similar prompts.',80,597,1000,45,24,C.muted);
}

// 6. Practical limits
{
  const s=slideBase(6,'What to keep in mind');
  textbox(s,'Useful for',80,183,480,64,35,C.accent,true);
  textbox(s,'Explaining ideas\nDrafting and editing\nHelping with code',80,266,490,237,29,C.ink);
  textbox(s,'Check carefully',690,183,490,64,35,C.accent,true);
  textbox(s,'A fluent answer can still be wrong.\nCheck important facts with reliable sources.\nDo not assume the model understands the world like a person.',690,266,500,280,27,C.ink);
}

for (let i=0;i<deck.slides.items.length;i++) {
  const png=await deck.export({slide:deck.slides.items[i],format:'png',scale:1});
  await fs.writeFile(path.join(buildDir,`slide-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));
}
const {finalizePresentation}=await import(pathToFileURL(path.join(skillDir,'container_tools/artifact_tool_utils.mjs')).href);
const stagingDir=path.join(buildDir,'finalizer');
await fs.mkdir(stagingDir,{recursive:true});
const candidatePath=path.join(stagingDir,'candidate.pptx');
await (await PresentationFile.exportPptx(deck)).save(candidatePath);
const result=await finalizePresentation({
  workspaceDir,candidatePath,finalPath,
  pythonExecutable:'/Users/harshitgoswami/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
  integrityValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
  explicitTotalSlideCount:6,
  requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
  fontPolicy:{basis:'design',families:['Aptos']},
  verifyArtifactToolImport:true,
  receiptPath:path.join(stagingDir,'validation.json')
});
console.log(JSON.stringify({result,finalPath},null,2));
