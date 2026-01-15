import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import countries110m from 'world-atlas/countries-110m.json';

const supportedCountries = {
    UK: { iso: 'GBR', center: [-1.5, 52.3] },
    CA: { iso: 'CAN', center: [-106.3, 56.1] },
    USA: { iso: 'USA', center: [-98.5, 39.8] },
    AUS: { iso: 'AUS', center: [134.5, -25.7] },
    NZ: { iso: 'NZL', center: [174.8, -41.2] },
    EU: { iso: 'FRA', center: [2.2, 46.2] },
};

const countryToIso = {
    'United Kingdom': 'GBR',
    'Canada': 'CAN',
    'United States of America': 'USA',
    'Australia': 'AUS',
    'New Zealand': 'NZL',
    'France': 'FRA',
};

const DashboardTopSector = ({ data }) => {
    const topSector = data.reduce((prev, current) =>
        current.weight > prev.weight ? current : prev
    );

    const countryMeta = supportedCountries[topSector.code];
    const isoCode = countryMeta?.iso || '';
    const center = countryMeta?.center || [0, 0];
    const isEuropeMode = topSector.code === 'EU';

    const countryIsoCodeMap = useMemo(() => {
        const map = {};
        for (const [countryName, iso] of Object.entries(countryToIso)) {
            map[countryName] = iso;
        }
        return map;
    }, []);

    return (
        <div className='relative h-[350px] w-[255px] p-5 border border-french-gray rounded-md flex flex-col justify-between'>
            <h1 className='font-bold z-10'>Top Sector</h1>

            <div className='absolute inset-0 z-0 overflow-hidden'>
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 300,
                        center,
                    }}
                    style={{ width: '100%', height: '100%' }}
                >
                    {/* Define the dotted pattern in the SVG */}
                    <defs>
                        <pattern
                            id="dotted-pattern-red"
                            patternUnits="userSpaceOnUse"
                            width="30" height="30">
                            <ellipse
                                cx="18" cy="18"
                                rx="12" ry="6"
                                transform="rotate(-45 18 18)"
                                fill="#EA1B40" />
                        </pattern>

                        <pattern
                            id="dotted-pattern-gray"
                            patternUnits="userSpaceOnUse"
                            width="30" height="30">
                            <ellipse
                                cx="18" cy="18"
                                rx="12" ry="6"
                                transform="rotate(-45 18 18)"
                                fill="#E5E5E5" />
                        </pattern>
                    </defs>

                    <Geographies geography={countries110m}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const countryIsoCode = countryIsoCodeMap[geo.properties.name];
                                // Determine if we should highlight this country
                                let isHighlighted;
                                if (isEuropeMode) {
                                    const [lng, lat] = geoCentroid(geo);
                                    // Rough bounding box for Europe
                                    isHighlighted = lng >= -10 && lng <= 40 && lat >= 34 && lat <= 72;
                                } else {
                                    isHighlighted = countryIsoCode === isoCode;
                                }
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={
                                            isHighlighted
                                                ? 'url(#dotted-pattern-red)'
                                                : 'url(#dotted-pattern-gray)'
                                        }
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ComposableMap>
            </div>

            <div className='flex flex-col z-10'>
                <span className='font-bold text-[28px]'>{topSector.weight.toFixed(2)} Kg</span>
                <span className='text-dim-gray'>
                    {topSector.city}, {topSector.sector}
                </span>
            </div>
        </div>
    );
};

export default DashboardTopSector;
