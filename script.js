var board = document.getElementById('gameArea');
var dotHolder = document.getElementById(`dotHolder`);
var triangleLength = 200;
var yIterator = 0;
var xIterator = 0;
var nodeSnapPoints = [];
var depth = 0;
var nodeID = 0;
var nodeGraph = {};
var fullNodeGraph = {};
var rand;

var firstOffset;
var randomize = false;
var dotsAtDepth;
var totalDepth;
var longestChain;
var batteryLocation;
	//example state
	// var dotsAtDepth = {
	// 	"0":[1,0],
	// 	"1":[1,0,0],
	// 	"2":[0,1,0],
	// 	"3":[0,2,0],
	// 	"4":[],
	// 	"5":[0,2,0],
	// 	"6":[0,1,0],
	// 	"7":[1,0,0],
	// 	"8":[1,0]
	// };

//First State

	// var firstOffset = false;
	// var dotsAtDepth = {
	// 	"0":[1,0],
	// 	"1":[1,0,0],
	// 	"2":[0,1,0],
	// 	"3":['0',2,0],
	// 	"4":[0,1,'0'],
	// 	"5":[1,0,0],
	// 	"6":[1,0]
	// };

//End First State

//Second State
	
	// var firstOffset = false;
	// var dotsAtDepth = {
	// 	"0":[1,0],
	// 	"1":[1,0,0],
	// 	"2":[0,1,0],
	// 	"3":['0',2,0],
	// 	"4":[0,1,0],
	// 	"5":[1,0,'0'],
	// 	"6":[1,0]
	// };

//End Second State

//Third State
	// var firstOffset = true;
	// var randomize = false;
	// var dotsAtDepth = {
	// 	"0":[1,0,'0'],
	// 	"1":['0','0',0],
	// 	"2":[0,0,0,'0'],
	// 	"3":[0,0,0],
	// 	"4":[0,0,'0',0],
	// 	"5":[0,0,'0'],
	// 	"6":[1,0,0],
	// };

	// var totalDepth = 6;
	// var dotsAtDepth = {"0":2,"1":3,"2":4,"3":3,"4":4,"5":3,"6":2,"7":0};

//End Third State

window.onload = (event) => {
	const queryString = window.location.search;
	if(queryString.replace("?","") == 2) {
		firstOffset = true;
		dotsAtDepth = {
			"0":[1,'0'],
			"1":[0],
			"2":[0,0],
			"3":['0'],
			"4":[1,'0'],
		};
	} else if(queryString.replace("?","") == 3) {
		firstOffset = true;
		randomize = false;
		dotsAtDepth = {
			"0":[1,0,'0'],
			"1":['0','0',0],
			"2":[0,0,0,'0'],
			"3":[0,0,0],
			"4":[0,0,'0',0],
			"5":[0,0,'0'],
			"6":[1,0,0],
		};
	} else if(queryString.replace("?","") == `random`) {
		firstOffset = true;
		randomize = true;
		dotsAtDepth = {
			"0":[1,0,0],
			"1":[0,0,0],
			"2":[0,0,0,0],
			"3":[0,0,0],
			"4":[0,0,0,0],
			"5":[0,0,0],
			"6":[1,0,0],
		};
	} else {
		firstOffset = true;
		dotsAtDepth = {
			"0":[1,'0'],
			"1":[0],
			"2":[0,0],
			"3":['0'],
			"4":[1,'0'],
		};
	}
	totalDepth = Object.keys(dotsAtDepth).length - 1;
	let allArrays = Object.values(dotsAtDepth);
	longestChain = allArrays.sort((a,b) => {
		return a.reduce((accumulator, c) => {
			if(c == 0) {
				c++;
			}
			return accumulator + c;
		}, 0) - b.reduce((accumulator, d) => {
			if(d == 0) {
				d++;
			}
			return accumulator + d;
		}, 0);
	})[allArrays.length-1].reduce((accumulator, e) => {
			if(e == 0) {
				e++;
			}
			return accumulator + e;
		}, 0);
	setSeed();
}

function setSeed() {
	let seedString;
	//let seedString = document.getElementById('gameSeed').value;
	if(!seedString) {
		seedString = randomColor();
	}
	var seedHash = cyrb128(seedString);
	rand = sfc32(seedHash[0], seedHash[1], seedHash[2], seedHash[3]);

	//starting code
	Array.from(document.querySelectorAll(`.gridFill`)).forEach((element) => {
		element.delete();
	});
	generateDots(firstOffset);
	generateLines();
	let strength = Array.from(document.querySelectorAll(`.goal`)).length;
	generateBattery(strength);
	Array.from(document.querySelectorAll(`.node`)).forEach((element) => {
		let connectedLines = overlayCheck(element, `line`);
		element.connectedLines = connectedLines;
	});
	if(randomize) {
		generateGoalNodes(6);
	}

	document.addEventListener("mousedown", mouseClick);
}

function mouseClick(event) {
  var rightclick;
  if (!event){
    var event = window.event;
  } 
  if (event.which){
    rightclick = (event.which == 3);
  } 
  else if (event.button) {
    rightclick = (event.button == 2);
  }
  if(rightclick) {// true or false
  	resetGrid(rightclick);
  }
}

function setStrength() {
	let strength = document.getElementById('strength').value;
	resetGrid();
	Array.from(document.querySelectorAll(`.gridButton`)).forEach((element) => {
		element.removeEventListener(`click`, toggleLine);
	});
}

function sendSignal(event) {
	let strength = Array.from(document.querySelectorAll(`.goal`)).length;
	resetGrid();
	Array.from(document.querySelectorAll(`.gridButton`)).forEach((element) => {
		element.removeEventListener(`click`, toggleLine);
	});
	if(strength == NaN) {
		return false;
	}
	event.target.style.backgroundColor = `#FAE01F`;
	event.target.style.border = `2px solid #7C638E`;
	if(pushSignal(event.target, strength)) {
		let touchedNodes = Array.from(document.querySelectorAll(`.completed`));
		let goalNodes = Array.from(document.querySelectorAll(`.goal`));
		if(arraysEqual(touchedNodes, goalNodes)) {
			touchedNodes.forEach((element) => {
				element.innerHTML = `✔`;
				element.style.color = `#228B22`;
			});
		} else {
			console.log(`failure`);
		}
		Array.from(document.querySelectorAll(`.gridButton`)).forEach((element) => {
			element.addEventListener(`click`, toggleLine);
		});
	}
}

function pushSignal(node, strength) {
	if(strength > 0) {
		let allShortestPaths = shortestPath(nodeGraph, node.id);
		let chosenGoal = [node.id, Infinity];
		Array.from(document.querySelectorAll(`.goal`)).forEach((element) => {
			if (!element.classList.contains(`completed`)) {
				if(allShortestPaths[element.id] < chosenGoal[1]) {
					chosenGoal[0] = element.id;
					chosenGoal[1] = allShortestPaths[element.id];
					chosenGoal[2] = element.clickNumber;
				} else if (allShortestPaths[element.id] == chosenGoal[1] && chosenGoal[1] != Infinity) {
					let tempPathNew = findShortestPath(nodeGraph, node.id, element.id);
					let tempPathOld = findShortestPath(nodeGraph, node.id, chosenGoal[0]);

					let lineIDArrayNew = [tempPathNew.path[tempPathNew.path.length-1], tempPathNew.path[tempPathNew.path.length-2]];
					lineIDArrayNew = lineIDArrayNew.sort(function (a, b) {  return a - b;  });
					let lineIDNew = `${lineIDArrayNew[0]},${lineIDArrayNew[1]}`;
					let lineNew = document.getElementById(`${lineIDNew}`);

					let lineIDArrayOld = [tempPathOld.path[tempPathOld.path.length-1], tempPathOld.path[tempPathOld.path.length-2]];
					lineIDArrayOld = lineIDArrayOld.sort(function (a, b) {  return a - b;  });
					let lineIDOld = `${lineIDArrayOld[0]},${lineIDArrayOld[1]}`;
					let lineOld = document.getElementById(`${lineIDOld}`);
					if (lineNew.children[0].clickNumber < lineOld.children[0].clickNumber) {
						chosenGoal[0] = element.id;
						chosenGoal[1] = allShortestPaths[element.id];
						chosenGoal[2] = element.clickNumber;						
					}
				}
			}
		});
		let pathToGoal = findShortestPath(nodeGraph, node.id, chosenGoal[0]);
		let hitGoal = document.getElementById(`${chosenGoal[0]}`);
		if (strength == pathToGoal.path.length - 1) {
			//success state
			hitGoal.style.backgroundColor = `#FAE01F`;
			for(let i = 0; i < pathToGoal.path.length-1; i++) {
				let lineIDArray = [pathToGoal.path[i], pathToGoal.path[i+1]];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				let lineID = `${lineIDArray[0]},${lineIDArray[1]}`;
				let line = document.getElementById(`${lineID}`);
				line.children[0].style.backgroundColor = `#FAE01F`;
				line.children[0].style.border = `2px solid #7C638E`;
			}
			hitGoal.classList.add(`completed`);
			hitGoal.classList.add(`active`);
			hitGoal.innerHTML = `${strength - 1}`
			let touchedNodes = Array.from(document.querySelectorAll(`.completed`));
			let goalNodes = Array.from(document.querySelectorAll(`.goal`));
			if(!arraysEqual(touchedNodes, goalNodes)) {
				pushSignal(hitGoal, strength - 1);
			}
		}
		else if (strength < pathToGoal.path.length) {
			//failure state too weak
			let wrongNode;
			for(let i = 0; i < strength; i++) {
				let lineIDArray = [pathToGoal.path[i], pathToGoal.path[i+1]];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				let lineID = `${lineIDArray[0]},${lineIDArray[1]}`;
				let line = document.getElementById(`${lineID}`);
				line.children[0].style.backgroundColor = `#FAE01F`;
				line.children[0].style.border = `2px solid #7C638E`;
				wrongNode = document.getElementById(`${pathToGoal.path[i+1]}`);
			} 
			// wrongNode.style.boxShadow = `0 0 20px #E0403C`;
			// wrongNode.style.border = `2px solid #E0403C`;
		}
		else {
			//failure state too strong, carry onward til strength gone
			if(hitGoal != node) {
				hitGoal.innerHTML = `⚠`;
				hitGoal.style.color = `#E0403C`;
			}
			for(let i = 0; i < pathToGoal.path.length-1; i++) {
				let lineIDArray = [pathToGoal.path[i], pathToGoal.path[i+1]];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				let lineID = `${lineIDArray[0]},${lineIDArray[1]}`;
				let line = document.getElementById(`${lineID}`);
				line.children[0].style.backgroundColor = `#FAE01F`;
				line.children[0].style.border = `2px solid #7C638E`;
			}
			let nextNode = hitGoal;
			for(let i = 0; i < (strength - (pathToGoal.path.length-1)); i++) {
				let connectedLines = overlayCheck(nextNode, `line`);
				let nextLine = null;
				for(const line of connectedLines) {
					if((line.style.opacity == 1 && line.style.backgroundColor != `rgb(250, 224, 31)`) && !nextLine) {
							nextLine = line;
					}
				}
				if(!nextLine) {
					return true;
				}
				nextLine.style.backgroundColor = `#FAE01F`;
				nextLine.style.border = `2px solid #7C638E`;
				nextNodeID = nextLine.parentElement.id.replace(nextNode.id,"").replace(",","");
				nextNode = document.getElementById(`${nextNodeID}`);
			}
		}
	}
	return true;
}

function resetGrid(rightclick) {
	Array.from(document.querySelectorAll(`.node`)).forEach((element) => {
		// element.removeEventListener(`click`, sendSignal);
		element.visited = false;
		element.style.backgroundColor = ``;
		element.style.border = ``;
		element.style.boxShadow = ``;
		element.innerHTML = ``;
		element.style.color = `#0078AB`;
	});
	Array.from(document.querySelectorAll(`.line`)).forEach((element) => {
		element.style.backgroundColor = ``;
		element.style.border = ``;
	});
	Array.from(document.querySelectorAll(`.goal`)).forEach((element) => {
		element.style.boxShadow = `0 0 20px #0078AB`;
		element.style.border = `2px solid #0078AB`;
		element.classList.remove(`completed`);
		element.classList.remove(`active`);
	});	
	if(rightclick) {
		Array.from(document.querySelectorAll(`.line`)).forEach((element) => {
			element.clickNumber = Infinity;
			element.style.opacity = `0.1`;
			let adjacentNodes = overlayCheck(element, `node`);
			nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
			nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;
		});		
	}
}

function shortestPath(graph, start) {
    // Create an object to store the shortest distance from the start node to every other node
    let distances = {};

    // A set to keep track of all visited nodes
    let visited = new Set();

    // Get all the nodes of the graph
    let nodes = Object.keys(graph);

    // Initially, set the shortest distance to every node as Infinity
    for (let node of nodes) {
        distances[node] = Infinity;
    }
    
    // The distance from the start node to itself is 0
    distances[start] = 0;

    // Loop until all nodes are visited
    while (nodes.length) {
        // Sort nodes by distance and pick the closest unvisited node
        nodes.sort((a, b) => distances[a] - distances[b]);
        let closestNode = nodes.shift();

        // If the shortest distance to the closest node is still Infinity, then remaining nodes are unreachable and we can break
        if (distances[closestNode] === Infinity) break;

        // Mark the chosen node as visited
        visited.add(closestNode);

        // For each neighboring node of the current node
        for (let neighbor in graph[closestNode]) {
            // If the neighbor hasn't been visited yet
            if (!visited.has(neighbor)) {
                // Calculate tentative distance to the neighboring node
                let newDistance = distances[closestNode] + graph[closestNode][neighbor];
                
                // If the newly calculated distance is shorter than the previously known distance to this neighbor
                if (newDistance < distances[neighbor]) {
                    // Update the shortest distance to this neighbor
                    distances[neighbor] = newDistance;
                }
            }
        }
    }

    // Return the shortest distance from the start node to all nodes
    return distances;
}

let shortestDistanceNode = (distances, visited) => {
  // create a default value for shortest
	let shortest = null;
	
  	// for each node in the distances object
	for (let node in distances) {
    	// if no node has been assigned to shortest yet
  		// or if the current node's distance is smaller than the current shortest
		let currentIsShortest =
			shortest === null || distances[node] < distances[shortest];
        	
	  	// and if the current node is in the unvisited set
		if (currentIsShortest && !visited.includes(node)) {
            // update shortest to be the current node
			shortest = node;
		}
	}
	return shortest;
};

let findShortestPath = (graph, startNode, endNode) => {
 
 // track distances from the start node using a hash object
   let distances = {};
 distances[endNode] = "Infinity";
 distances = Object.assign(distances, graph[startNode]);// track paths using a hash object
 let parents = { endNode: null };
 for (let child in graph[startNode]) {
  parents[child] = startNode;
 }
  
 // collect visited nodes
   let visited = [];// find the nearest node
   let node = shortestDistanceNode(distances, visited);
 
 // for that node:
 while (node) {
 // find its distance from the start node & its child nodes
  let distance = distances[node];
  let children = graph[node]; 
      
 // for each of those child nodes:
      for (let child in children) {
  
  // make sure each child node is not the start node
        if (String(child) === String(startNode)) {
          continue;
       } else {
          // save the distance from the start node to the child node
          let newdistance = distance + children[child];// if there's no recorded distance from the start node to the child node in the distances object
// or if the recorded distance is shorter than the previously stored distance from the start node to the child node
          if (!distances[child] || distances[child] > newdistance) {
// save the distance to the object
     distances[child] = newdistance;
// record the path
     parents[child] = node;
    } 
         }
       }  
      // move the current node to the visited set
      visited.push(node);// move to the nearest neighbor node
      node = shortestDistanceNode(distances, visited);
    }
  
 // using the stored paths from start node to end node
 // record the shortest path
 let shortestPath = [endNode];
 let parent = parents[endNode];
 while (parent) {
  shortestPath.push(parent);
  parent = parents[parent];
 }
 shortestPath.reverse();
  
 //this is the shortest path
 let results = {
  distance: distances[endNode],
  path: shortestPath,
 };
 // return the shortest path & the end node's distance from the start node
   return results;
};

var totalClicks = 0;
function toggleLine(event) {
	let line = event.target.children[0];
	if(!line) {
		line = event.target;
	}
	let adjacentNodes = overlayCheck(line, `node`);
	if(line.style.opacity == `1`) {
		line.clickNumber = Infinity;
		line.style.opacity = `0.1`;
		nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
		nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;		
	} else {
		line.clickNumber = totalClicks;
		totalClicks++;
		line.style.opacity = `1`;
		nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = 1;
		nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = 1;			
	}
  if(batteryLocation) {
  	sendSignal(batteryLocation);	    	
  }
}

function generateGoalNodes(strength){
	let keys = Object.keys(fullNodeGraph);
	let startingNode = keys[Math.floor(keys.length * rand())];
	let allDistances = shortestPath(fullNodeGraph, startingNode);
	let goalNodeIDs = [startingNode];
	for (i = 1; i < strength; i++) {
		var filtered = Object.keys(allDistances).reduce(function (filtered, key) {
		    if (allDistances[key] <= i && allDistances[key] != 0 && !goalNodeIDs.includes(key)) {
		    	filtered[key] = allDistances[key];
		    } 
		    return filtered;
		}, {});
		let nextNode = Object.keys(filtered)[Math.floor(Object.keys(filtered).length * rand())];
		goalNodeIDs.push(nextNode);
	}
	for (let nodeID of goalNodeIDs) {
		let node = document.getElementById(`${nodeID}`);
		node.style.boxShadow = `0 0 20px #0078AB`;
		node.style.border = `2px solid #0078AB`;
		node.classList.add(`goal`);		
	}	
}

function getNextRight(x1, y1) {
  hyp = triangleLength, // hypotenuse
  theta_deg = 30, // theta angle in degrees
  rad = (parseFloat(theta_deg) * Math.PI) / 180, // convert deg to radians
  
  // opp = hyp * sin(θ)
  opp = Math.round((hyp * Math.sin(rad)) * 100) / 100, // opposite side
  
  // adj = √( (hyp * hyp) - (opp * opp) )
  adj = Math.round((Math.sqrt((hyp * hyp) - (opp * opp))) * 100) / 100, // adjacent side
  x2 = x1 + adj, y2 = y1 + opp; // end point

  return [x2, y2, adj, hyp];

}

function createNode(){
	var node = document.createElement(`div`);
	node.classList.add(`node`);
	node.classList.add(`gridFill`);
	node.id = nodeID;
	nodeID++;
	dotHolder.appendChild(node);
	return node;
}

function generateDots(lastOffset) {
	if (depth <= totalDepth) {
		if(dotsAtDepth[depth].length) {
			let triangleInfo = getNextRight(0,0);
			let offsetLeft = (window.innerWidth - 2 * triangleInfo[2] * (longestChain-1))/2;
			let offsetTop = (window.innerHeight - triangleInfo[1] * (totalDepth+1))/2;
			if(!lastOffset) {
				//offset from Center
				offsetLeft += triangleInfo[2];
			}
			let positionInRow = 0;
			for(const node of dotsAtDepth[depth]) {
				if(node == 0) {
					let newNode = createNode();
					newNode.style.top = `${offsetTop + triangleInfo[1] * depth}px`;
					newNode.style.left = `${offsetLeft - newNode.clientWidth/2 + 2 * triangleInfo[2] * (positionInRow)}px`;
					nodeCenter = [Math.round(newNode.offsetLeft + newNode.clientWidth / 2), Math.round(newNode.offsetTop + newNode.clientHeight / 2)];
					nodeSnapPoints.push(nodeCenter);
					positionInRow++;
					if(typeof node == `string`) {
						newNode.style.boxShadow = `0 0 20px #0078AB`;
						newNode.style.border = `2px solid #0078AB`;
						newNode.classList.add(`goal`);		
					}
				} else {
					positionInRow += node;
				}
			}	
		}
		depth++;
		generateDots(!lastOffset);
	}
}

function generateBattery(strength) {
	var battery = document.createElement(`div`);
	battery.classList.add(`battery`);
	battery.classList.add(`active`);
	battery.innerHTML = `${strength}`;
	dotHolder.appendChild(battery);
	let triangleInfo = getNextRight(0,0);
	let offsetLeft = (window.innerWidth - 2 * triangleInfo[2] * (longestChain-1))/2;
	let offsetTop = (window.innerHeight - triangleInfo[1] * (totalDepth+1))/2;
	battery.style.top = `${Math.max(offsetTop - battery.clientHeight*1.5, 0)}px`;
	battery.style.left = `${Math.max(offsetLeft - battery.clientHeight*1.5,0)}px`;
	console.log(battery);
	dragElement(battery);
	return battery;

}

function generateLines() {
	let lineID = 0;
	for (const property of nodeSnapPoints) {
		for(let i = -1; i <= 1; i ++) {
			const button = document.createElement(`button`);
			button.classList.add(`gridButton`);
			button.classList.add(`gridFill`);
			dotHolder.appendChild(button);
			button.id = lineID;
			lineID++;
			button.style.height = triangleLength + `px`;
			button.style.width = triangleLength / 5 + `px`;
			button.style.top = `${property[1]}px`;
			button.style.left = `${(property[0] - button.style.width.replace("px","")/2.5)}px`;
			button.style.transform = `rotate(${(i)*60}deg)`;
			button.addEventListener(`click`, toggleLine);
			const line = document.createElement(`div`);
			line.classList.add(`line`);
			line.style.opacity = `0.1`;
			line.style.height = triangleLength + `px`;
			line.style.width = triangleLength / 18 + `px`;
			button.appendChild(line);
			let adjacentNodes = overlayCheck(button, `node`);
			if(adjacentNodes.length != 2) {
				button.remove();
			} else {
				let lineIDArray = [adjacentNodes[0].id, adjacentNodes[1].id];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				button.id = `${lineIDArray[0]},${lineIDArray[1]}`;
				if(!nodeGraph[adjacentNodes[0].id]) {
					nodeGraph[adjacentNodes[0].id] = {};
				}
				if(!nodeGraph[adjacentNodes[1].id]) {
					nodeGraph[adjacentNodes[1].id] = {};
				}
				nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
				nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;
				if(!fullNodeGraph[adjacentNodes[0].id]) {
					fullNodeGraph[adjacentNodes[0].id] = {};
				}
				if(!fullNodeGraph[adjacentNodes[1].id]) {
					fullNodeGraph[adjacentNodes[1].id] = {};
				}
				fullNodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = 1;
				fullNodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = 1;
			}
		}
	}
}

function randomColor() {
	let n = (Math.random() * 0xfffff * 1000000).toString(16);
	return '#' + n.slice(0, 6);
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  let aNew = a;
  let bNew = b;
  aNew.sort();
  bNew.sort();

  for (var i = 0; i < aNew.length; ++i) {
    if (aNew[i] !== bNew[i]) return false;
  }
  return true;
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(rand() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function overlayCheck(div, tagToCheck) {
  let points = Array.from(document.querySelectorAll(`.${tagToCheck}`));
  points.sort((a, b) => {
  	let topfirst = a.style.top.replace("px","") - b.style.top.replace("px","");
  	let leftfirst = a.style.left.replace("px","") - b.style.left.replace("px","");
  	return leftfirst;
  });

  let allOverlaps = [];

  let rightPos = (elem) => elem.getBoundingClientRect().right;
  let leftPos = (elem) => elem.getBoundingClientRect().left;
  let topPos = (elem) => elem.getBoundingClientRect().top;
  let btmPos = (elem) => elem.getBoundingClientRect().bottom;

	for (let i = 0; i < points.length; i++) {
	  let isOverlapping = !(
		rightPos(div) < leftPos(points[i]) ||
		leftPos(div) > rightPos(points[i]) ||
		btmPos(div) < topPos(points[i]) ||
		topPos(div) > btmPos(points[i])
	  );

	  if (isOverlapping) {
			allOverlaps.push(points[i]);
	  }
	}
	return allOverlaps;
}

//randomization code YOINKED

function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

function sfc32(a, b, c, d) {
    return function() {
      a |= 0; b |= 0; c |= 0; d |= 0; 
      var t = (a + b | 0) + d | 0;
      d = d + 1 | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

//end randomization code YOINKED


function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    let overlayedNode = overlayCheck(elmnt, `node`);
    if(overlayedNode[0] && !Array.from(overlayedNode[0].classList).includes(`goal`)) {
    	batteryLocation = null;
	    resetGrid();
    }
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement(e) {
    // stop moving when mouse button is released:
    let overlayedNode = overlayCheck(elmnt, `node`);
    if(overlayedNode[0] && !Array.from(overlayedNode[0].classList).includes(`goal`)) {
	    elmnt.style.top = (overlayedNode[0].offsetTop) + "px";
	    elmnt.style.left = (overlayedNode[0].offsetLeft) + "px";
	    batteryLocation = {target:overlayedNode[0]};
	    if(batteryLocation) {
	    	sendSignal(batteryLocation);	    	
	    }
    }
    document.onmouseup = null;
    document.onmousemove = null;
  }
}