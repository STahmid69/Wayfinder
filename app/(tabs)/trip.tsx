import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ImageBackground, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TopAppBar from '../../components/TopAppBar';
import tw from '../../lib/tailwind';

export default function TripDashboardScreen() {
    return (
        <View style={tw`flex-1 bg-[#F4F4F5] dark:bg-[#121212]`}>
            {/* Top Bar with transparent background to let the Hero image show through */}
            <TopAppBar customStyle="absolute top-0 w-full z-50 pt-8" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>

                {/* Hero Section */}
                <ImageBackground
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt9ZY4RXdKRh480Nj0fRxLIXObDnhIzt4G1V7YeUV9QY34ENFuBWmeFk9RIch6qlLMzvIQ-14qFp77Ng4_2UprRcDhKwOwec8VvmbpQkJ2jkimgYqSNl1rLtSJ2lDiCsJ-9RP3bzyzlRdV2LrILqdeFG-2cbHhjynl7ubS0jkCqTde4_CNcjfG3U4ouZcGDcW07r_aOrkZAYHSd_oKbUjYpnd227-VQGmb0Jzx5B-08ISOBotDuH4FQQwbiExbwVIShFyagrcALaM' }}
                    style={tw`w-full pt-40 pb-28 px-6`}
                    imageStyle={tw`opacity-90 dark:opacity-60`}
                ><View style={tw`absolute inset-0 bg-black/40`} /><View style={tw`absolute bottom-0 left-0 right-0 h-32`} /><View style={tw`z-10`}><View style={tw`bg-white/20 self-start px-3 py-1 rounded-full mb-4 border border-white/30`}><Text style={tw`text-white text-[10px] font-black uppercase tracking-widest`}>Next Expedition</Text></View><Text style={tw`text-5xl font-black tracking-tighter text-white leading-tight`}>Start Your Next Odyssey</Text><Text style={tw`text-white/90 font-medium text-base mt-2 leading-relaxed max-w-[85%]`}>The grid ends here. Create a custom expedition or unite with a crew already carving paths through the wild.</Text></View></ImageBackground>

                <View style={tw`px-5 -mt-16 z-20`}>

                    {/* Start New Trip Card */}
                    <TouchableOpacity style={tw`bg-[#FF5F00] rounded-3xl p-6 mb-4 shadow-xl overflow-hidden relative`}>
                        <View style={tw`absolute -right-10 -top-10 opacity-20`}>
                            <MaterialIcons name="map" size={180} color="white" />
                        </View>
                        <View style={tw`w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-16`}>
                            <MaterialCommunityIcons name="map-marker-plus" size={24} color="white" />
                        </View>
                        <Text style={tw`text-white font-black text-2xl mb-1`}>Start New Trip</Text>
                        <Text style={tw`text-white/80 font-medium text-sm`}>Design a unique route from scratch</Text>
                    </TouchableOpacity>

                    {/* Join Existing Card (Add Trip With Code) */}
                    <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 mb-10 shadow-sm dark:shadow-xl border border-zinc-100 dark:border-zinc-800`}>
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <View style={tw`w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl items-center justify-center`}>
                                <MaterialIcons name="group-add" size={20} color="#0058bb" style={tw`dark:text-[#00D1FF]`} />
                            </View>
                            <Text style={tw`text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest`}>JOIN EXISTING</Text>
                        </View>

                        <View style={tw`bg-zinc-100/80 dark:bg-[#121212] rounded-2xl p-4 mb-4 border border-zinc-200/50 dark:border-zinc-800 flex-row justify-center`}>
                            <TextInput
                                placeholder="— — — — — —"
                                placeholderTextColor="#A1A1AA"
                                style={tw`text-2xl tracking-[10px] text-center text-black dark:text-white font-black w-full`}
                                maxLength={6}
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity style={tw`flex-row items-center justify-center gap-2 mt-2`}>
                            <Text style={tw`text-[#0058bb] dark:text-[#00D1FF] font-black uppercase tracking-widest text-xs`}>Join Crew</Text>
                            <MaterialIcons name="arrow-forward" size={14} color="#0058bb" style={tw`dark:text-[#00D1FF]`} />
                        </TouchableOpacity>
                    </View>

                    {/* Recent Journeys */}
                    <View style={tw`flex-row justify-between items-end mb-6 px-1`}>
                        <View>
                            <Text style={tw`text-3xl font-black text-black dark:text-white leading-none`}>Recent</Text>
                            <Text style={tw`text-3xl font-black text-black dark:text-white leading-none`}>Journeys</Text>
                            <View style={tw`h-1 w-12 bg-[#FF5F00] mt-2`} />
                        </View>
                        <TouchableOpacity style={tw`flex-row items-center gap-1 bg-black dark:bg-white px-3 py-1.5 rounded-full shadow-md`}>
                            <MaterialCommunityIcons name="play-circle-outline" size={12} color={tw.prefixMatch('dark') ? 'black' : 'white'} />
                            <Text style={tw`text-white dark:text-black text-[10px] font-black uppercase tracking-widest`}>Convoy Replay (Anim)</Text>
                        </TouchableOpacity>
                    </View>

                    {/* High Sierra Loop */}
                    <TouchableOpacity style={tw`rounded-3xl overflow-hidden mb-4 h-48 bg-zinc-200 dark:bg-zinc-800 shadow-sm`}>
                        <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK2Ff_O3TigDqLh3i69A-2o7O54PjOhcWb3F4CBy7M-mD1Jk62sK0l2b8Q7I9Z2nI-aH0Fz20mZgZ1C1ZIf5z6Q71c-S7w_oRcw_9B6pT9iG3UeJkS38H-C5x5Z6UvNn29K1v2L-1K1_zL92tH1n_P9J_1M' }} style={tw`absolute inset-0 w-full h-full`} />
                        <View style={tw`absolute inset-0 bg-black/40`} />
                        <View style={tw`flex-1 justify-end p-5`}>
                            <View style={tw`flex-row items-center gap-2 mb-2`}>
                                <View style={tw`bg-green-700 px-2 py-0.5 rounded-sm`}>
                                    <Text style={tw`text-white text-[8px] font-black uppercase tracking-widest`}>Completed</Text>
                                </View>
                                <Text style={tw`text-white/80 text-[10px] font-bold uppercase tracking-widest`}>Oct 2023</Text>
                            </View>
                            <Text style={tw`text-white font-black text-2xl mb-1`}>High Sierra Loop</Text>
                            <View style={tw`flex-row items-center gap-1`}>
                                <MaterialIcons name="location-on" size={12} color="#FF6A00" />
                                <Text style={tw`text-white/90 text-xs font-medium`}>420 Miles • 4 Waypoints</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Mojave Drift */}
                    <TouchableOpacity style={tw`rounded-3xl overflow-hidden mb-10 h-48 bg-zinc-200 dark:bg-zinc-800 shadow-sm`}>
                        <Image source={{ uri: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} style={tw`absolute inset-0 w-full h-full`} />
                        <View style={tw`absolute inset-0 bg-black/40`} />
                        <View style={tw`flex-1 justify-end p-5`}>
                            <View style={tw`flex-row items-center gap-2 mb-2`}>
                                <View style={tw`bg-[#FF5F00] px-2 py-0.5 rounded-sm`}>
                                    <Text style={tw`text-white text-[8px] font-black uppercase tracking-widest`}>In Progress</Text>
                                </View>
                                <Text style={tw`text-white/80 text-[10px] font-bold uppercase tracking-widest`}>Currently Active</Text>
                            </View>
                            <Text style={tw`text-white font-black text-2xl mb-1`}>Mojave Drift</Text>
                            <View style={tw`flex-row items-center gap-1`}>
                                <MaterialIcons name="location-on" size={12} color="#FF6A00" />
                                <Text style={tw`text-white/90 text-xs font-medium`}>128 Miles • 2 Waypoints</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Gamification / Leaderboard */}
                    <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 mb-8 shadow-sm dark:shadow-xl border border-zinc-100 dark:border-zinc-800`}>
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <View style={tw`w-8 h-8 bg-orange-50 dark:bg-[#FF5F00]/10 rounded-lg items-center justify-center`}>
                                    <MaterialIcons name="emoji-events" size={16} color="#FF5F00" />
                                </View>
                                <Text style={tw`text-black dark:text-white font-black text-xl`}>Convoy Leaderboard</Text>
                            </View>
                            <Text style={tw`text-[#FF5F00] font-bold text-xs uppercase tracking-widest`}>TOP 10%</Text>
                        </View>

                        {/* Team Synergy Score */}
                        <View style={tw`flex-row justify-between items-center bg-[#00D1FF]/10 dark:bg-[#00D1FF]/20 p-4 rounded-2xl mb-4 border border-[#00D1FF]/30`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <MaterialIcons name="hub" size={24} color="#00D1FF" />
                                <View>
                                    <Text style={tw`text-black dark:text-white font-black`}>Team Coordination Score</Text>
                                    <Text style={tw`text-zinc-500 font-bold text-[10px]`}>Based on formation gap & timing</Text>
                                </View>
                            </View>
                            <View style={tw`items-end`}>
                                <Text style={tw`text-[#0058bb] dark:text-[#00D1FF] font-black text-xl`}>98%</Text>
                            </View>
                        </View>

                        {/* Rank 1 */}
                        <View style={tw`flex-row justify-between items-center bg-zinc-50 dark:bg-[#121212] p-3 rounded-2xl mb-2 border border-yellow-400/30`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <Text style={tw`text-yellow-500 font-black text-lg w-4`}>1</Text>
                                <View style={tw`bg-[#1C1C1E] dark:bg-white w-8 h-8 rounded-full items-center justify-center`}>
                                    <Text style={tw`text-white dark:text-black font-bold text-xs`}>Y</Text>
                                </View>
                                <Text style={tw`text-black dark:text-white font-bold`}>You (Pacemaker)</Text>
                            </View>
                            <View style={tw`items-end`}>
                                <Text style={tw`text-black dark:text-white font-black`}>1,240 <Text style={tw`text-zinc-500 text-[10px]`}>pts</Text></Text>
                            </View>
                        </View>

                        {/* Rank 2 */}
                        <View style={tw`flex-row justify-between items-center p-3 rounded-2xl mb-2`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <Text style={tw`text-zinc-500 font-black text-lg w-4`}>2</Text>
                                <View style={tw`bg-[#00FF66] w-8 h-8 rounded-full items-center justify-center`}>
                                    <Text style={tw`text-black font-bold text-xs border border-zinc-800 rounded-full`}>A</Text>
                                </View>
                                <Text style={tw`text-black dark:text-white font-bold`}>Alex <Text style={tw`text-zinc-500 text-[10px] font-normal`}>(-260)</Text></Text>
                            </View>
                            <View style={tw`items-end`}>
                                <Text style={tw`text-black dark:text-white font-black`}>980</Text>
                            </View>
                        </View>

                        {/* Badges Earned */}
                        <View style={tw`mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800`}>
                            <Text style={tw`text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-3`}>Recent Badges</Text>
                            <View style={tw`flex-row gap-3`}>
                                <View style={tw`bg-purple-50 dark:bg-purple-900/30 p-2 rounded-xl flex-1 items-center border border-purple-100 dark:border-purple-900/50`}>
                                    <MaterialIcons name="stars" size={24} color="#A855F7" style={tw`mb-1`} />
                                    <Text style={tw`text-black dark:text-white font-bold text-[10px] text-center`}>Perfect Run</Text>
                                </View>
                                <View style={tw`bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded-xl flex-1 items-center border border-yellow-100 dark:border-yellow-900/50`}>
                                    <MaterialCommunityIcons name="crown" size={24} color="#EAB308" style={tw`mb-1`} />
                                    <Text style={tw`text-black dark:text-white font-bold text-[10px] text-center`}>Best Leader</Text>
                                </View>
                                <View style={tw`bg-orange-50 dark:bg-orange-900/30 p-2 rounded-xl flex-1 items-center border border-orange-100 dark:border-orange-900/50`}>
                                    <MaterialIcons name="how-to-vote" size={24} color="#FF5F00" style={tw`mb-1`} />
                                    <Text style={tw`text-black dark:text-white font-bold text-[10px] text-center`}>Decisive</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Nearby Hotspots Container */}
                    <View style={tw`bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 mb-8 shadow-sm dark:shadow-xl border border-zinc-100 dark:border-zinc-800`}>
                        <View style={tw`flex-row items-center gap-3 mb-6`}>
                            <View style={tw`w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg items-center justify-center`}>
                                <MaterialIcons name="map" size={16} color="#0058bb" style={tw`dark:text-[#00D1FF]`} />
                            </View>
                            <Text style={tw`text-black dark:text-white font-black text-xl`}>Nearby Hotspots</Text>
                        </View>

                        {/* Item 1 */}
                        <View style={tw`flex-row items-center gap-4 mb-4`}>
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' }} style={tw`w-16 h-16 rounded-xl`} />
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-black dark:text-white font-bold text-base mb-1`}>Cedar Hollow Camp</Text>
                                <Text style={tw`text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-widest`}>3.2 MILES AWAY • CLEAR SKIES</Text>
                            </View>
                        </View>

                        {/* Item 2 */}
                        <View style={tw`flex-row items-center gap-4 mb-6 bg-zinc-50 dark:bg-[#121212] p-2 rounded-2xl`}>
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' }} style={tw`w-16 h-16 rounded-xl`} />
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-black dark:text-white font-bold text-base mb-1`}>Eagle Peak Vista</Text>
                                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-widest leading-tight`}>12.5 MILES AWAY • CROWDED</Text>
                            </View>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity style={tw`border border-blue-100 dark:border-blue-900/40 rounded-full py-4 items-center justify-center`}>
                            <Text style={tw`text-[#0058bb] dark:text-[#00D1FF] font-black uppercase tracking-widest text-[10px]`}>Open Map Exploration</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Weather Forecast */}
                    <View style={tw`bg-zinc-200/50 dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm dark:shadow-xl`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-[#5A3B31] dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest`}>Weather Forecast</Text>
                            <View style={tw`w-4 h-4 bg-[#5A3B31] dark:bg-zinc-600 rounded-full items-center justify-center`}>
                                <MaterialIcons name="chevron-right" size={12} color="white" />
                            </View>
                        </View>

                        <View style={tw`flex-row justify-between`}>
                            <View style={tw`items-center`}>
                                <MaterialCommunityIcons name="white-balance-sunny" size={24} color="#D97706" />
                                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase mt-2 mb-1`}>MON</Text>
                                <Text style={tw`text-black dark:text-white font-black text-xl`}>72°</Text>
                            </View>
                            <View style={tw`w-[1px] bg-zinc-300 dark:bg-zinc-700 h-10 self-center`} />
                            <View style={tw`items-center`}>
                                <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color="#0058bb" style={tw`dark:text-[#00D1FF]`} />
                                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase mt-2 mb-1`}>TUE</Text>
                                <Text style={tw`text-black dark:text-white font-black text-xl`}>68°</Text>
                            </View>
                            <View style={tw`w-[1px] bg-zinc-300 dark:bg-zinc-700 h-10 self-center`} />
                            <View style={tw`items-center`}>
                                <MaterialCommunityIcons name="weather-cloudy" size={24} color="#0058bb" style={tw`dark:text-[#00D1FF]`} />
                                <Text style={tw`text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase mt-2 mb-1`}>WED</Text>
                                <Text style={tw`text-black dark:text-white font-black text-xl`}>64°</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
