import './App.css'
import { useState, useEffect } from 'react'
import ReactLoading from 'react-loading'
import axios from 'axios'
import Modal from 'react-modal'
import BarChart from 'react-bar-chart'
import { jsPDF } from 'jspdf'
import domtoimage from 'dom-to-image'

import ReactPaginate from 'react-paginate'

const margin = { top: 20, right: 20, bottom: 30, left: 40 }

function PokeDex() {
  const [pokemons, setPokemons] = useState([])
  const [filteredPokemons, setFilteredPokemons] = useState([])
  const [pokemonDetail, setPokemonDetail] = useState(null)
  const [pokemonDetailContent, setPokemonDetailContent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [barChartData, setBarChartData] = useState([])

  const [filterName, setFilterName] = useState('')
  const [order, setOrder] = useState('asc')
  const [totalPages, setTotalPages] = useState(0)

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
    },
    overlay: { backgroundColor: '#282c34' },
  }

  useEffect(() => {
    Modal.setAppElement('body')
    axios
      .get('https://pokeapi.co/api/v2/pokemon')
      .then((res) => {
        const { count, results } = res.data
        setTotalPages(Math.ceil(count / 20))
        setPokemons(results)
        setTimeout(() => {
          setIsLoading(false)
        }, 500)
      })
      .catch((error) => console.log(error))
  }, [])

  useEffect(() => {
    setFilteredPokemons(pokemons)
  }, [pokemons])

  useEffect(() => {
    if (pokemonDetail) {
      const { url } = pokemonDetail
      axios
        .get(url)
        .then((res) => {
          const { sprites, stats } = res.data
          setPokemonDetailContent({ sprites, stats })
          const tmpChart = []
          stats.map((item, idx) =>
            tmpChart.push({
              text: idx + 1,
              value: item.base_stat,
            }),
          )

          setBarChartData(tmpChart)
        })
        .catch((error) => console.log(error))
    }
  }, [pokemonDetail])

  useEffect(() => {
    let tmpPokemons = pokemons.filter(
      (pok) => pok.name.toLowerCase().indexOf(filterName.toLowerCase()) !== -1,
    )

    tmpPokemons =
      order === 'asc'
        ? tmpPokemons.sort((a, b) => {
            const nameA = a.name.toUpperCase()
            const nameB = b.name.toUpperCase()
            if (nameA < nameB) {
              return -1
            }
            if (nameA > nameB) {
              return 1
            }

            return 0
          })
        : tmpPokemons.sort((a, b) => {
            const nameA = a.name.toUpperCase()
            const nameB = b.name.toUpperCase()
            if (nameA > nameB) {
              return -1
            }
            if (nameA < nameB) {
              return 1
            }

            return 0
          })

    setFilteredPokemons([...tmpPokemons])
  }, [filterName, order, pokemons])

  const handleDownloadPDF = () => {
    const input = document.getElementById('pdfModal')
    const pdf = new jsPDF()
    if (pdf) {
      domtoimage.toPng(input).then((imgData) => {
        pdf.addImage(imgData, 'PNG', 10, 10)
        pdf.save('download.pdf')
      })
    }
  }

  const handlePageClick = (event) => {
    setIsLoading(true)
    const p = event.selected
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${p * 20}&limit=20`
    axios
      .get(url)
      .then((res) => {
        const { results } = res.data
        setPokemons(results)
        setTimeout(() => {
          setIsLoading(false)
        }, 500)
      })
      .catch((error) => console.log(error))
  }

  return (
    <div>
      <header className="App-header">
        <div className="card">
          <div className="card-header d-flex">
            <input
              className="form-control mr-sm-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            ></input>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginLeft: 10 }}
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            >
              {order === 'asc' ? (
                <img
                  src="/images/sort-ascending-outlined.svg"
                  alt="sorting icon"
                  style={{ width: 23, height: 23 }}
                />
              ) : (
                <img
                  src="/images/sort-descending-outlined.svg"
                  alt="sorting icon"
                  style={{ width: 23, height: 23 }}
                />
              )}
            </button>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="loading-section">
                <ReactLoading type="spinningBubbles" color="black" />
              </div>
            ) : (
              <ul className="list-group list-group-flush list-content">
                {filteredPokemons.map((item, idx) => (
                  <li
                    key={idx}
                    className="list-group-item"
                    onClick={() => setPokemonDetail(item)}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card-footer text-muted">
            {!pokemonDetail && (
              <ReactPaginate
                breakLabel="..."
                nextLabel="next >"
                onPageChange={handlePageClick}
                pageRangeDisplayed={3}
                pageCount={totalPages}
                previousLabel="< previous"
                renderOnZeroPageCount={null}
                breakClassName={'page-item'}
                breakLinkClassName={'page-link'}
                containerClassName={'pagination'}
                pageClassName={'page-item'}
                pageLinkClassName={'page-link'}
                previousClassName={'page-item'}
                previousLinkClassName={'page-link'}
                nextClassName={'page-item'}
                nextLinkClassName={'page-link'}
                activeClassName={'active'}
              />
            )}
          </div>
        </div>
      </header>
      {pokemonDetail && (
        <Modal
          isOpen={!!pokemonDetail && !!pokemonDetailContent}
          contentLabel={pokemonDetail?.name || ''}
          onRequestClose={() => {
            setPokemonDetail(null)
          }}
          style={customStyles}
        >
          <div className="container" style={{ textAlign: 'right' }}>
            <button
              type="button"
              className="btn btn-outline-info"
              onClick={handleDownloadPDF}
            >
              Download
            </button>
          </div>
          <div id="pdfModal" className="container">
            <div className="row">
              <div className="col-sm">
                <div className="card" style={{ width: '18rem' }}>
                  <img
                    className="card-img-top"
                    src={pokemonDetailContent?.sprites?.front_default}
                    alt="Card cap"
                  />
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Stat Name</th>
                        <th scope="col">Base Stat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pokemonDetailContent?.stats.map((item, idx) => (
                        <tr key={idx}>
                          <th scope="row">{idx + 1}</th>
                          <td>{item.stat.name}</td>
                          <td>{item.base_stat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-sm">
                {barChartData.length > 0 && (
                  <div style={{ paddingTop: 50 }}>
                    <BarChart
                      ylabel="Base Stat"
                      width={350}
                      height={500}
                      margin={margin}
                      data={barChartData}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PokeDex
