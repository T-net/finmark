import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

// styles
import './styles.scss';

// actions
import { setMenuItem } from '../actions';

// components
import MenuItemsComponent from 'components/sidebar/menu-items';

class SidebarLayersComponent extends React.Component {
  render() {
    const layers = [
      { value: 'sectors', label: 'Sectors', text: 'Select the industry/sector of data points you would like to view.' },
      { value: 'contextual_layers', label: 'Contextual layers', text: 'Bring other useful data layers to your map.' },
      { value: 'national_surveys', label: 'National surveys', text: 'View national surveys that got conducted in this region.' }
    ];

    return (
      <MenuItemsComponent
        items={layers}
        onSelectMenuItem={setMenuItem}
      />
    );
  }
}

export default SidebarLayersComponent;
