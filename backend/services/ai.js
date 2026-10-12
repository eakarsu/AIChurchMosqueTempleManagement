const {callOpenRouter}=require('../lib/aiHelpers');
const {currentFields}=require('./nativeAIContext');
async function askAI(prompt,systemPrompt){const options=currentFields();const preferences=Object.fromEntries(['review_context','review_goal','tone','output_format'].filter(key=>typeof options[key]==='string').map(key=>[key,options[key]]));if(Object.keys(preferences).length)prompt+='\n\nOwner review preferences (preserve saved source facts, permissions and approvals):\n'+JSON.stringify(preferences);const data=await callOpenRouter(systemPrompt,prompt,{max_tokens:1024});const content=data.choices?.[0]?.message?.content;if(typeof content!=='string'||!content.trim())throw Error('The provider returned an empty answer.');return content;}
module.exports={askAI};
