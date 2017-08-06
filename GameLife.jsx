const Cell = (props)=>{
    const {i, j, cellSize, onClick, onMouseOver, isAlive} = props;
    const colr=(isAlive? 'green': 'lightgray')
    return <rect x={i*cellSize} y={j*cellSize} width={cellSize} height={cellSize} fill={colr} stroke='gray' onClick={()=>onClick(j,i)} onMouseOver={()=> onMouseOver(j,i)}/>
}

const HorizCells = (props)=>{
    const {j, cellSize, onClick, nbCol, lineCensus, onMouseOver} = props;
    return (
        <g>
            {
                R.range(0,nbCol).map((i)=>{
                    return <Cell 
                        key={i}
                        i={i}
                        j={j}
                        cellSize={cellSize}
                        onClick={onClick}
                        onMouseOver={onMouseOver}
                        isAlive={lineCensus[i]}
                    />
                })
            }
        </g>
    );


}
const Matrix = (props)=>{
    const {cellSize, onClick, nbCol, nbRow, census, onMouseOver} = props;
    return (
        <g>
            {
                R.range(0,nbRow).map((j)=>{
                    return <HorizCells
                        key={j}
                        j={j}
                        cellSize={cellSize}
                        onClick={onClick} 
                        onMouseOver={onMouseOver} 
                        nbCol={nbCol}
                        lineCensus={census[j]}
                    />
                } )
            }
        </g>
    );

}

// const enrich=(min, step)=>R.when(R.gt(min), R.add(step))
// const impoverish=(max, step)=>R.when(R.lte(max), R.add(-step))

// const inTheRange=(min, maxExclude) => R.pipe(enrich(0,maxExclude), impoverish(maxExclude, maxExclude))
// inTheRange :: Number -> Number -> Number
const inTheRange=(min, maxExclude) => R.mathMod(R.__, maxExclude)

// isAlive :: Number -> Number -> [[Number]] -> Number -> Number -> Boolean
const isAlive = (x,y, census, nbCol, nbRow)=>{

    const x_=inTheRange(0, nbRow)(x)
    const y_=inTheRange(0, nbCol)(y)
    // console.log(`${x} becomes ${x_} with nbCol=${nbCol}
    // ${y} becomes ${y_}
    // `);
    return census[x_][y_];
}


//can be seen as range Squared  as it is range * range
//can be seen as create Matrix with the coordinates being in a range) and then  flattened one level
// INFO :: coordinatesInRange follows the same syntax as Range the first argument is inclusive, the second is not.
// coordinatesInRange :: Number -> Number -> [[Number, Number]]
const coordinatesInRange = R.converge(R.xprod, [R.range, R.range]) //really meaning R.xprod(R.range(x,y), R.range(x,y))
// The following function is inelegant : if you apply with just one argument it throws an error
//const coordinatesInRange =(x,y) => R.apply(R.xprod, R.repeat(R.range(x,y), 2)) //really meaning R.xprod(R.range(x,y), R.range(x,y))


// cloneAndFlip :: Function -> [Function, Function]
const cloneAndFlip =(func) => [func, R.flip(func)]

// neighboursOfDist :: Integer -> [[Integer]]
const neighboursOfDist=  (n) => {
    const borders = [-n, n];
    const everythingInbetween = R.range(-n, n+1);
    //const prod_1 = R.xprod(borders, everythingInbetween);
    //const prod_2 = R.flip(R.xprod)(borders, everythingInbetween);
    //return R.union(prod_1, prod_2)
    return R.converge(R.union)( cloneAndFlip(R.xprod)) (borders, everythingInbetween); // We are doing something like a * b + b * a      (here * : cross product , + : union)
    // return R.converge(R.union, [R.xprod, R.flip(R.xprod)])(borders, everythingInbetween);
}



//relative to my position sphere like definition everything between is included
// neighboursWithin :: Number -> [[Number, Number]]
const neighboursWithin = R.converge(coordinatesInRange, [R.negate, R.inc]);
//
// neighs :: [[Number,Number]]
const neighs=neighboursOfDist(1)

console.log(neighs)

//absolute position
// absoluteNeighbours :: [Number, Number] -> [[Number, Number]] 
const absoluteNeighbours = me => neighs.map(R.zipWith(R.add, me));

// immediateNeighbours :: [Number, Number] -> [[Number, Number]]
const immediateNeighbours = absoluteNeighbours

// doILive :: Number -> Number -> [[Number]] -> Number -> Number -> Boolean
const doILive = (x,y, census,nbCol, nbRow)=>{
    const me = [x,y]
    //const myNeighs=neighSqrs.map(R.zipWith(R.add,me))
    const myNeighs = immediateNeighbours(me)
    const getLifeStatus= (neigh)=> isAlive(neigh[0], neigh[1], census, nbCol, nbRow)
    const neighCount =R.countBy(R.identity, myNeighs.map(getLifeStatus))[true] || 0;
    const myLife = isAlive(x,y, census, nbCol,nbRow);
    //console.log('doIlive' + (t1 -t0) + 'milliseconds');
    return (myLife && R.contains(neighCount,[2,3])) || neighCount === 3 

}

// createMatrix :: Number -> Number -> (Number -> Number -> a) -> [[a]]
const createMatrix =(nbRow, nbCol, func) => R.splitEvery(nbCol)(R.xprod(R.range(0,nbRow), R.range(0,nbCol)).map(func));

// getNextGenerationFunc :: [[Boolean]] -> Number -> Number -> [[Boolean]]
const getNextGenerationFunc=(census, nbCol, nbRow)=>{
    var t0 = performance.now();
    //func :: [Number, Number]  -> Boolean
    const func = (item) => doILive(item[0],item[1], census,nbCol,nbRow);
    const res = createMatrix(nbRow, nbCol, func);
    //console.log(JSON.stringify(res));
    // console.log( `
    // Is ${R.equals(res, getNextGeneration(census,nbCol,nbRow))}
    // `);
    var t1 = performance.now();
    console.log('function purely' + (t1 -t0) + 'milliseconds');

    return res
}
/*
const getNextGeneration=(census, nbCol, nbRow)=>{
    // console.log(JSON.stringify(getNextGenerationFunc(census,nbCol, nbRow)));
    let census_ = R.clone(census);
    var t0 = performance.now();
    for(let i = 0; i < nbRow; i++ ){
        for(let j = 0; j < nbCol; j++ ){
            census_[i][j] = doILive(i,j, census, nbCol, nbRow);
        }
    }
    var t1 = performance.now();
    console.log('functiongen' + (t1 -t0) + 'milliseconds');
//console.log(getNextGenerationFunc(census,nbCol,nbRow)==census_)
    return census_
}
*/

//randomBoolean :: a  -> Boolean
const randomBoolean = (x) => Math.random() < 0.5;


//randomBoolMatrix :: Number -> Number -> [[Boolean]]
const randomBoolMatrix =(nbRow, nbCol) => createMatrix(nbRow, nbCol, randomBoolean);

//getRandomGeneration :: Number -> Number -> [[Boolean]]
const getRandomGeneration=(nbCol, nbRow)=>{
    return randomBoolMatrix(nbRow, nbCol);
};

class GameLife extends React.Component{
    constructor(props){
        super(props);
        const [height, width] = [400, 800];
        const cellSize=20;
        const [nbCol, nbRow] = [width, height].map(x=>x/cellSize);
        this.state={
            height,
            width,
            cellSize,
            census: randomBoolMatrix(nbRow,nbCol),
            currGen :0,
            paused : false,
            nbCol,
            nbRow,
        };
        this.onChoose=this.onChoose.bind(this);
        this.showDetails=this.showDetails.bind(this);


        this.onClear=this.onClear.bind(this);
        this.onUpdate=this.onUpdate.bind(this);
        this.onRandomize=this.onRandomize.bind(this);
        this.stop=this.stop.bind(this);
        this.start=this.start.bind(this);
        this.onManualUpdate=this.onManualUpdate.bind(this);



    }
    componentDidMount() {
        this.start(); 

    }
    start(){
        this.timeout=setTimeout(function(){this.onUpdate()}.bind(this), 1000);
        this.setState({
            paused:false,
        });

    }
    stop(){
        if(this.timeout){
            clearTimeout(this.timeout);
            this.setState({
                paused:true,
            });
        }
    }



    componentWillUnmount(){
        this.stop();
    }


    setTimer(){
        setTimeout(function(){this.onUpdate()}.bind(this), 1000);
    }
    onManualUpdate(){
        const {census, currGen, nbCol, nbRow} = this.state;
        this.setState({
            //census:getNextGeneration(census,nbCol, nbRow),
            census:getNextGenerationFunc(census,nbCol, nbRow),
            currGen: currGen + 1,
        });
    }


    onUpdate(){
        const {census, currGen, nbCol, nbRow} = this.state;
        this.setState({
            census:getNextGenerationFunc(census,nbCol, nbRow),
            currGen: currGen + 1,
        });
        this.timeout=setTimeout(function(){this.onUpdate()}.bind(this), 1000);
    }
    onClear(){
        const {census} = this.state; 
        const emptyAll = R.map(R.map(R.F));
        this.setState({
            census: emptyAll(census),
            currGen: 0,
        });
    }
    onRandomize(){
        const {nbCol,nbRow} = this.state; 
        this.setState({
            census: getRandomGeneration(nbCol,nbRow),
            currGen: 0,
        });
    }
    showDetails(i,j){
        const {census,nbCol,nbRow} = this.state;
        console.log(`details about ${i} ${j}`);
        console.log(isAlive(i,j, census, nbCol, nbRow));
        //console.log(neighbours(i,j, census, nbCol, nbRow));
        console.log(doILive(i,j, census, nbCol, nbRow));

    }
    onChoose(i, j){
        // console.log(`chosen ${i} ${j}`);
        const {census} = this.state;
        // console.log(JSON.stringify(census));
        const lpath=R.lensPath([i,j]); 
        // console.log(JSON.stringify(R.over(lpath, R.not, census)));
        this.setState({
            census:R.over(lpath, R.not, census),
        }

        )
    }
    render(){
        const {height, width, cellSize, census, currGen, paused} = this.state;
        const [nbCol, nbRow] = [width, height].map(x=>x/cellSize);
        // console.log(JSON.stringify(this.state.census));

        return(
            <div className='container'>
                <h2>Gen : {currGen} </h2>
                <svg height={height} width={width}>
                    <Matrix cellSize={cellSize} nbCol={nbCol} nbRow={nbRow} onClick={this.onChoose} onMouseOver={this.showDetails} census={census}/>
                    <rect width={width} height={height} fill='none' stroke='#000000'/>
                </svg>
                <br />
                <button onClick={this.onClear}><i className='fa fa-eraser fa-lg'></i> </button>
                { paused &&
                        <button onClick={this.onManualUpdate}><i className='fa fa-step-forward fa-lg'></i></button>
                }
                <button onClick={this.onRandomize}><i className='fa fa-random fa-lg'></i></button>
                { (!paused)?
                        <button onClick={this.stop}><i className='fa fa-stop fa-lg'></i></button>
                        :
                        <button onClick={this.start}><i className='fa fa-play fa-lg'></i></button>
                }
            </div>
        );

    }
}    
ReactDOM.render(<GameLife /> , document.querySelector('#root')); 
