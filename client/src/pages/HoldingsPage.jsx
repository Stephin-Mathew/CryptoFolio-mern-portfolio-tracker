import React, { useState } from 'react';
import { AssetTypeTabs } from '../components/AssetTypeTabs';
import { HoldingsTable } from '../components/HoldingsTable';
import { useCurrency } from '../context/CurrencyContext';

export function HoldingsPage({
  holdings = [],
  prices = {},
  loading,
  activeTab,
  setActiveTab,
  onUpdateHolding,
  onDeleteHolding,
  onEditClick,
  onUpdatePrice,
  onResetPrice,
  onUpdateLogo,
  onResetLogo,
  rowStatuses,
}) {
  const { currency } = useCurrency();

  const filteredHoldings = holdings.filter((h) => {
    if (activeTab === 'all') return true;
    return h.assetType === activeTab;
  });

  const tabCounts = {
    all: holdings.length,
    crypto: holdings.filter((h) => h.assetType === 'crypto').length,
    stock: holdings.filter((h) => h.assetType === 'stock').length,
    mutual_fund: holdings.filter((h) => h.assetType === 'mutual_fund').length,
    cash: holdings.filter((h) => h.assetType === 'cash').length,
  };

  return (
    <div className="page-container holdings-page">
      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header row with asset type tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <AssetTypeTabs activeTab={activeTab} setActiveTab={setActiveTab} counts={tabCounts} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Tip: Click any cell to edit inline
          </div>
        </div>

        {/* Holdings table */}
        <HoldingsTable
          holdings={filteredHoldings}
          prices={prices}
          onUpdateHolding={onUpdateHolding}
          onDeleteHolding={onDeleteHolding}
          onEditClick={onEditClick}
          onUpdatePrice={onUpdatePrice}
          onResetPrice={onResetPrice}
          onUpdateLogo={onUpdateLogo}
          onResetLogo={onResetLogo}
          rowStatuses={rowStatuses}
          hideBuyPrice={activeTab === 'crypto'}
          displayCurrency={currency}
        />
      </div>
    </div>
  );
}
