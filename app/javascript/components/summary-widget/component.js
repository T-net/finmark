import React from 'react';
import PropTypes from 'prop-types';
import Numeral from 'numeral';

// styles
import './styles.scss';

class SummaryWidgetWrapperComponent extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    body: PropTypes.object.isRequired
  }

  state = { widgetData: [] };

  componentDidMount() {
    const { url, body } = this.props;

    fetch(url, {
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: Object.keys(body).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`).join('&')
    })
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((data) => {
        const widgetData = data.rows[0];

        this.setState({
          widgetData: [
            { label: 'TOTAL POPULATION', value: Numeral(widgetData.total_population).format('0,0'), subvalue: null },
            { label: 'RURAL POPULATION PERCENTAGE', value: `${Numeral(widgetData.rural_population_percentage / 100).format('0.0%')}`, subvalue: Numeral(widgetData.rural_population).format('0,0') },
            { label: 'URBAN POPULATION PERCENTAGE:', value: `${Numeral(widgetData.urban_population_percentage / 100).format('0.0%')}`, subvalue: Numeral(widgetData.urban_population).format('0,0') }
          ]
        });
      });
  }

  render() {
    const { title } = this.props;
    const { widgetData } = this.state;

    return (
      <div className="c-summary-widget-element">
        <div className="widget-title">
          {title}
        </div>

        <table
          className="widget-table"
        >
          <thead>
            <tr>
              {widgetData.map(item => (
                <th key={item.label}>
                  <div className="widget-label">
                    {item.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {widgetData.map(item => (
                <td key={item.label}>
                  <div className="widget-main-value">{item.value}</div>

                  {!!item.subvalue &&
                    <div className="widget-sub-value">({item.subvalue})</div>
                  }
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default SummaryWidgetWrapperComponent;
