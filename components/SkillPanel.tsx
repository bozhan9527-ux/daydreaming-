import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { JobTier } from '../game/combat';
import { currentMaterialTier, MATERIAL_TIER_LABELS } from '../game/materials';
import {
  ACTIVE_SLOT_IDS,
  canUpgradeSkillSlot,
  isPassiveSlot,
  PASSIVE_SLOT_IDS,
  getSkillSlotBonusDescription,
  skillSlotLevelCap,
  skillSlotUpgradeBookCost,
  SKILL_SLOT_DESCRIPTIONS,
  SKILL_SLOT_NAMES,
  SkillSlotId,
} from '../game/skillTree';
import { getTierSkillFlavor } from '../game/skillTreeFlavor';
import { getSkillIcon } from '../game/sprites/skillIcons';
import {
  canUpgradeStudentSkillSlot,
  getStudentSkillFlavor,
  getStudentSkillSlotBonusDescription,
  STUDENT_SKILL_LEVEL_CAP,
} from '../game/studentSkillTree';
import { useGameState } from '../hooks/useGameState';
import { JobPromotionCard } from './JobPromotionCard';
import { PixelSprite } from './PixelSprite';
import { SkillLoadoutEditor } from './SkillLoadoutEditor';
import { TierBrowsePanel } from './TierBrowsePanel';

const TILE_SIZE = 56;

export function SkillPanel() {
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const archetype = useGameState((state) => state.job.archetype);
  const branch = useGameState((state) => state.job.branch);
  const skillTree = useGameState((state) => state.skillTree);
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const level = useGameState((state) => state.level);
  const tier = useGameState((state) => state.jobTier);
  const skillBooks = useGameState((state) => state.skillBooks);
  const upgradeSkillSlot = useGameState((state) => state.upgradeSkillSlot);
  const upgradeStudentSkillSlot = useGameState((state) => state.upgradeStudentSkillSlot);
  const upgradeSkillSlotMax = useGameState((state) => state.upgradeSkillSlotMax);
  const upgradeStudentSkillSlotMax = useGameState((state) => state.upgradeStudentSkillSlotMax);

  // 畢業前(!hasChosenJob)還沒有主職技能樹可看,固定顯示學生技能;畢業後兩棵樹永久並存
  // (學生加成不會因為選定主職而失效),用這個分頁內部切換兩邊,預設看職業技能。
  const [viewingJobTree, setViewingJobTree] = useState(true);
  const showJobTree = hasChosenJob && viewingJobTree;
  const [selectedSlot, setSelectedSlot] = useState<SkillSlotId>('active1');

  // 依階級瀏覽(見 TierBrowsePanel):每一階都是獨立的0-10級軌道,可以隨時切換回去投資
  // 更早的階級(見 game/skillTree.ts 的 SkillTreeLevels 說明),viewingTier 直接驅動整張
  // 技能卡片(圖示/名稱/敘述/等級/升級按鈕),不是另外開一張獨立預覽卡。預設看目前實際
  // 職業階級,只有職業技能樹有階級概念,學生技能沒有。
  const [viewingTier, setViewingTier] = useState<JobTier>(tier);
  const isViewingUnlockedTier = viewingTier <= tier;

  const slotLevels = showJobTree ? skillTree[archetype][viewingTier] : studentSkillTree;
  const cap = showJobTree ? skillSlotLevelCap(viewingTier) : STUDENT_SKILL_LEVEL_CAP;

  // 技能書分階制(見 game/materials.ts):要用哪一階的書,對應「正在瀏覽/投資的那一階」,
  // 不是固定目前職業階級——玩家可以切回去用低階書投資低階,學生技能固定吃初階
  // (currentMaterialTier 在 !hasChosenJob 時固定回傳0)。
  const materialTier = currentMaterialTier(hasChosenJob && showJobTree, viewingTier);
  const availableBooks = skillBooks[materialTier];

  const selectedLevel = slotLevels[selectedSlot];
  const selectedBookCost = skillSlotUpgradeBookCost(selectedLevel);
  const canUpgradeSelected = showJobTree
    ? isViewingUnlockedTier && canUpgradeSkillSlot(selectedLevel, viewingTier, availableBooks)
    : canUpgradeStudentSkillSlot(selectedLevel, availableBooks);
  const selectedAtCap = selectedLevel >= cap;

  const selectedFlavor = getStudentSkillFlavor(level.level, selectedSlot);
  // 職業技能格的名稱/敘述要依「正在瀏覽的階級」(viewingTier)換套文案——tier1沿用
  // game/skillTree.ts 既有內容,tier2~5改吃game/skillTreeFlavor.ts依階級+分支寫的專屬文案
  // (見getTierSkillFlavor),不能像舊版那樣不管幾階都固定顯示tier1的內容。
  const jobFlavor =
    viewingTier === 1
      ? { name: SKILL_SLOT_NAMES[archetype][selectedSlot], description: SKILL_SLOT_DESCRIPTIONS[archetype][selectedSlot] }
      : getTierSkillFlavor(archetype, branch, viewingTier, selectedSlot);
  const selectedName = showJobTree ? jobFlavor.name : selectedFlavor.name;
  const selectedDesc = showJobTree ? jobFlavor.description : selectedFlavor.description;
  const selectedBonusDesc = showJobTree
    ? getSkillSlotBonusDescription(archetype, selectedSlot, selectedLevel)
    : getStudentSkillSlotBonusDescription(selectedSlot, selectedLevel);

  return (
    <View style={styles.container}>
      {hasChosenJob && (
        <View style={styles.treeToggleRow}>
          <Pressable
            style={[styles.treeToggleTab, viewingJobTree && styles.treeToggleTabActive]}
            onPress={() => setViewingJobTree(true)}
          >
            <Text style={[styles.treeToggleLabel, viewingJobTree && styles.treeToggleLabelActive]}>職業技能</Text>
          </Pressable>
          <Pressable
            style={[styles.treeToggleTab, !viewingJobTree && styles.treeToggleTabActive]}
            onPress={() => setViewingJobTree(false)}
          >
            <Text style={[styles.treeToggleLabel, !viewingJobTree && styles.treeToggleLabelActive]}>學生技能</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.hint}>
        {showJobTree
          ? '技能書只顯示目前職業的技能;切換職業後這裡會跟著換一套'
          : hasChosenJob
            ? '畢業前投資的學生技能永久保留,加成疊加在職業技能之上,仍可持續花書升級'
            : '這是你的學生技能,畢業後不會消失,加成會疊加在職業技能之上並可以持續升級'}
      </Text>

      {/* 首頁4個主動技能欄的配置——只跟「職業技能」這棵樹有關(學生技能沒有欄位可選,
          固定4招),所以只在 showJobTree 時顯示,切去學生技能檢視時收起來。 */}
      {showJobTree && <SkillLoadoutEditor archetype={archetype} tier={tier} />}

      {/* 職業階級晉升(見 game/jobPromotion.ts):晉升按鈕+依階級瀏覽技能圖示變化,
          同樣只跟「職業技能」這棵樹有關,學生期沒有階級概念。 */}
      {showJobTree && <JobPromotionCard />}
      {showJobTree && <TierBrowsePanel currentTier={tier} viewingTier={viewingTier} onSelectTier={setViewingTier} />}

      <View style={styles.grid}>
        {[...PASSIVE_SLOT_IDS, ...ACTIVE_SLOT_IDS].map((slot) => {
          const slotLevel = slotLevels[slot];
          const isSelected = slot === selectedSlot;
          const icon = getSkillIcon(archetype, slot, showJobTree ? viewingTier : 1);
          return (
            <Pressable
              key={slot}
              style={[styles.tile, isSelected && styles.tileSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <View style={styles.iconWrap}>
                <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={3} />
              </View>
              <View style={styles.tileKindTag}>
                <Text style={styles.tileKindTagText}>{isPassiveSlot(slot) ? '被動' : '主動'}</Text>
              </View>
              <View style={styles.tileLevelBadge}>
                <Text style={styles.tileLevelText}>{slotLevel}/{cap}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailKind}>{isPassiveSlot(selectedSlot) ? '被動技能' : '主動技能'}</Text>
          <Text style={styles.detailName}>
            {selectedName} {selectedLevel}/{cap}
            {selectedAtCap ? '(已達本階上限)' : ''}
          </Text>
        </View>
        <Text style={styles.detailDesc}>{selectedDesc}</Text>
        <Text style={styles.detailBonus}>{selectedBonusDesc}</Text>
        <Text style={styles.detailCap}>
          {showJobTree ? `${viewingTier}階上限:${cap} 級` : `目前階級上限:${cap} 級`}
        </Text>

        {showJobTree && !isViewingUnlockedTier ? (
          <Text style={styles.lockedHint}>尚未晉升到{viewingTier}階,晉升後才能投資這一階</Text>
        ) : (
          <View style={styles.upgradeButtonRow}>
            <Pressable
              style={[styles.upgradeButton, !canUpgradeSelected && styles.upgradeButtonDisabled]}
              onPress={() =>
                showJobTree ? upgradeSkillSlot(archetype, viewingTier, selectedSlot) : upgradeStudentSkillSlot(selectedSlot)
              }
              disabled={!canUpgradeSelected}
            >
              <Text style={styles.upgradeLabel}>
                {selectedAtCap
                  ? '已達上限'
                  : `升級 (${selectedBookCost} 本${MATERIAL_TIER_LABELS[materialTier]}技能書,持有 ${availableBooks} 本)`}
              </Text>
            </Pressable>
            {/* 批量升級:書夠的話一次衝到存量能到的最高等級,不用照書量一級一級手動點——
                呼應「批量升級改善」的需求。跟上面單級版本共用同一個 canUpgradeSelected 判斷
                (書不夠升1級,當然也不夠衝更多級)。 */}
            {!selectedAtCap && (
              <Pressable
                style={[styles.upgradeButtonMax, !canUpgradeSelected && styles.upgradeButtonDisabled]}
                onPress={() =>
                  showJobTree
                    ? upgradeSkillSlotMax(archetype, viewingTier, selectedSlot)
                    : upgradeStudentSkillSlotMax(selectedSlot)
                }
                disabled={!canUpgradeSelected}
              >
                <Text style={styles.upgradeLabel}>衝到底</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 300,
    gap: 10,
    alignItems: 'center',
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
  },
  treeToggleRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    padding: 3,
    gap: 3,
  },
  treeToggleTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  treeToggleTabActive: {
    backgroundColor: '#4a4456',
  },
  treeToggleLabel: {
    color: '#8a8a95',
    fontSize: 12,
    fontWeight: '600',
  },
  treeToggleLabelActive: {
    color: '#f2f2f2',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    backgroundColor: '#2a2a35',
    borderWidth: 2,
    borderColor: '#59462b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileSelected: {
    borderColor: '#c9a94f',
    backgroundColor: '#4a4456',
  },
  iconWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileKindTag: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  tileKindTagText: {
    color: '#c9a94f',
    fontSize: 8,
    fontWeight: '600',
  },
  tileLevelBadge: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tileLevelText: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  detailCard: {
    width: '100%',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  detailHeader: {
    gap: 2,
  },
  detailKind: {
    color: '#8a8a95',
    fontSize: 11,
  },
  detailName: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  detailDesc: {
    color: '#c8c8d0',
    fontSize: 12,
    lineHeight: 17,
  },
  detailBonus: {
    color: '#8fd4a8',
    fontSize: 12,
  },
  detailCap: {
    color: '#6a6a75',
    fontSize: 11,
  },
  lockedHint: {
    marginTop: 4,
    color: '#e0a040',
    fontSize: 11,
    textAlign: 'center',
  },
  upgradeButtonRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 6,
  },
  upgradeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
  },
  // 「衝到底」跟單級升級按鈕並排,用藍色(互動中訊號色)區分開——不是危險/警示動作,
  // 只是同一個升級操作的批量版本。
  upgradeButtonMax: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#274357',
    borderWidth: 1,
    borderColor: '#6ab0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonDisabled: {
    opacity: 0.4,
  },
  upgradeLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
});
