function AuctionRules() {
  return (
    <section className="card cricket-card">
      <div className="section-head">
        <div>
          <h2 className="panel-title">Auction Rules</h2>
          <p className="section-note">SPL Season 4 માટે સત્તાવાર ઑક્શન માર્ગદર્શિકા</p>
        </div>
      </div>

      <article className="rules-block">
        <h3>‼️ ઑક્શન નિયમો ‼️</h3>
      </article>

      <article className="rules-block">
        <h3>ઓક્શન બજેટ</h3>
        <ul>
          <li>
            પ્રત્યેક કેપ્ટનને 1200 પોઈન્ટનું નિર્ધારિત બજેટ આપવામાં આવે છે, જેનો ઉપયોગ ખેલાડીઓની ખરીદી માટે થશે.
          </li>
          <li>ખેલાડીઓના બેઝ પ્રાઇસ સ્થિર રહેશે: Set A - 50, Set B - 50, Set C - 30.</li>
          <li>
            જો કોઈ ખેલાડી Set A માં લાસ્ટ રહે, તો તેના પોઈન્ટ મિનિમમ લાસ્ટ બિડ પોઈન્ટ તરીકે કાઉન્ટ થશે. બાકીના સેટ માટે બેઝ પોઈન્ટ જ રહેશે.
          </li>
          <li>Set A ની મહત્તમ મર્યાદા: 750 પોઈન્ટ.</li>
          <li>Set B ની મહત્તમ મર્યાદા: 1000 પોઈન્ટ.</li>
          <li>Set C ની મહત્તમ મર્યાદા: 1200 પોઈન્ટ.</li>
        </ul>
      </article>

      <article className="rules-block">
        <h3>બિડીંગ નિયમો</h3>
        <ul>
          <li>બિડીંગ હંમેશા બેઝ પ્રાઇસથી શરૂ થશે.</li>
          <li>Set A અને Set B માં બિડ 30 પોઈન્ટથી વધશે.</li>
          <li>Set C માં બિડ 10 પોઈન્ટથી વધશે.</li>
          <li>સૌથી ઊંચી બિડ કરનાર કેપ્ટન ખેલાડી મેળવે છે.</li>
        </ul>
      </article>

      <article className="rules-block">
        <h3>ઓક્શન ક્રમ</h3>
        <ul>
          <li>ખેલાડીઓ સેટ મુજબ પ્રગટાવવામાં આવશે (બાઉલમાંથી ચિટ કઢો).</li>
          <li>સંપૂર્ણ યાદીમાંથી ઑક્શન ક્રમને રેન્ડમાઈઝ કરવાની પસંદગી કરી શકાય છે.</li>
        </ul>
      </article>

      <article className="rules-block">
        <h3>ટીમ રચના નિયમો</h3>
        <ul>
          <li>દરેક ટીમમાં ફરજિયાત રીતે Set A માંથી 2 ખેલાડી હોવા જોઈએ.</li>
          <li>દરેક ટીમમાં ફરજિયાત રીતે Set B માંથી 2 ખેલાડી હોવા જોઈએ.</li>
          <li>દરેક ટીમમાં ફરજિયાત રીતે Set C માંથી 3 ખેલાડી હોવા જોઈએ.</li>
          <li>ટીમનો મહત્તમ કદ: 8 ખેલાડી (કેપ્ટન સાથે).</li>
        </ul>
      </article>
    </section>
  )
}

export default AuctionRules
